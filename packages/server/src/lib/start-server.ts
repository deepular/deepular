import { bootstrapApplication } from '@angular/platform-browser';
import { from, tap, Observable } from 'rxjs';
import { HttpRouterRegistry, HttpRequest, HtmlResponse } from '@deepkit/http';
import { App } from '@deepkit/app';
import {
  unwrapType,
  CORE_CONFIG,
  NgKitControllerDefinition,
  getNgKitSerializer,
  makeSerializableStateKey,
} from '@ngkit/core';
import { ReflectionClass, resolveRuntimeType } from '@deepkit/type';
import { rpcClass, RpcKernel } from '@deepkit/rpc';
import { BSONSerializer } from '@deepkit/bson';
import { ClassType } from '@deepkit/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  TransferState,
  ApplicationConfig,
  Provider,
  mergeApplicationConfig,
  signal,
} from '@angular/core';
import {
  renderApplication,
  provideServerRendering,
  ɵSERVER_CONTEXT as SERVER_CONTEXT,
} from '@angular/platform-server';

export async function startServer(
  component: ClassType,
  document: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: App<any>,
) {
  const router = app.get(HttpRouterRegistry);
  const { controllers: rpcControllers } = app.get(RpcKernel);

  const injector = app.getInjectorContext().createChildScope('rpc');

  const rpcControllerNgProviders: Provider[] = [];

  for (const [, { controller }] of rpcControllers.entries()) {
    const controllerType = resolveRuntimeType(controller);
    const controllerReflectionClass = ReflectionClass.from(controllerType);
    const instance = injector.get(controller);

    const controllerMetadata = rpcClass._fetch(controller);
    if (
      !(controllerMetadata?.definition instanceof NgKitControllerDefinition)
    ) {
      throw new Error('Missing NgKitControllerDefinition');
    }

    const controllerReflectionMethods = controllerReflectionClass.getMethods();
    const controllerMethodNames = controllerReflectionMethods.map(
      method => method.name,
    );

    rpcControllerNgProviders.push({
      provide: controllerMetadata.definition._token,
      deps: [TransferState],
      useFactory(transferState: TransferState) {
        const serializers = new Map<string, BSONSerializer>(
          controllerReflectionClass.getMethods().map(method => {
            const returnType = unwrapType(method.getReturnType());
            const serialize = getNgKitSerializer(returnType);
            return [method.name, serialize];
          }),
        );

        return new Proxy(instance, {
          get: (target, propertyName: string) => {
            if (!controllerMethodNames.includes(propertyName)) return;

            const serialize = serializers.get(propertyName)!;

            // TODO: only @rpc.loader() methods should be callable on the server
            return (...args: []) => {
              let result = target[propertyName](...args);

              const transferStateKey = makeSerializableStateKey(
                controllerMetadata.definition!.path,
                propertyName,
                args,
              );

              const transferResult = (data: unknown) => {
                transferState.set(transferStateKey, serialize({ data }));
              };

              const isPromise = result instanceof Promise;
              const isObservable = result instanceof Observable;

              if (!isPromise && !isObservable) {
                transferResult(result);
                return signal(result);
              }

              if (isPromise) {
                result = from(result);
              }

              result = result.pipe(tap(transferResult));

              return toSignal(result, { requireSync: true });
            };
          },
        });
      },
    });
  }

  const config: ApplicationConfig = mergeApplicationConfig(CORE_CONFIG, {
    providers: [provideServerRendering(), ...rpcControllerNgProviders],
  });

  const bootstrap = () => bootstrapApplication(component, config);

  router.get('/', async (request: HttpRequest) => {
    const html = await renderApplication(bootstrap, {
      url: request?.getUrl() || '/',
      document,
      platformProviders: [
        {
          provide: SERVER_CONTEXT,
          useValue: 'deepkit',
        },
      ],
    });

    return new HtmlResponse(html);
  });

  await app.run(['server:start']);
}
