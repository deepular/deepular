import { bootstrapApplication } from '@angular/platform-browser';
import { from, tap, Observable } from 'rxjs';
import { HttpRouterRegistry, HttpRequest, HtmlResponse } from '@deepkit/http';
import { App } from '@deepkit/app';
import {
  ngKitSerializer,
  makeNgKitStateKey,
  unwrapType,
  APP_CONFIG,
  NgKitControllerDefinition,
} from '@ngkit/core';
import { ReflectionClass, resolveRuntimeType, Type } from '@deepkit/type';
import { rpcClass, RpcKernel } from '@deepkit/rpc';
import { BSONSerializer, getBSONSerializer } from '@deepkit/bson';
import { ClassType } from '@deepkit/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  TransferState,
  ApplicationConfig,
  Provider,
  mergeApplicationConfig,
  StateKey,
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

    const controllerPropertyNames = Object.getOwnPropertyNames(
      controller.prototype,
    );

    // server
    /*const proxy = new Proxy(instance, {
      get: (target, propertyName) => {
        const sig = signal(null);

        // TODO: only @rpc.loader() methods should be callable on the server
        return (...args: []) => {
          const result = controller[propertyName](...args);

          if (result instanceof Observable) {
            result.toPromise().then(result => sig.set(result));
            // return toSignal(result);
          }

          if (result instanceof Promise) {
            result.then(result => sig.set(result));
            // return toSignal(from(result), { requireSync: true });
          }
          // return signal(result);

          return sig;
        }
      },
    });*/

    const controllerMetadata = rpcClass._fetch(controller);
    if (
      !(controllerMetadata?.definition instanceof NgKitControllerDefinition)
    ) {
      throw new Error('Missing NgKitControllerDefinition');
    }

    rpcControllerNgProviders.push({
      provide: controllerMetadata.definition._token,
      deps: [TransferState],
      useFactory(transferState: TransferState) {
        const cache = new Map<
          string,
          {
            returnType: Type;
            transferStateKey: StateKey<unknown>;
            bsonSerializer: BSONSerializer;
          }
        >();

        return new Proxy(instance, {
          get: (target, propertyName: string) => {
            if (
              !controllerPropertyNames.includes(propertyName) ||
              propertyName === 'constructor'
            )
              return;

            if (!cache.has(propertyName)) {
              const reflectionMethod =
                controllerReflectionClass.getMethod(propertyName);
              const returnType = unwrapType(reflectionMethod.getReturnType());
              // TODO: transfer key should include args
              const transferStateKey = makeNgKitStateKey(
                controllerMetadata.definition.path,
                propertyName,
              );
              const bsonSerializer = getBSONSerializer(
                ngKitSerializer,
                returnType,
              );
              cache.set(propertyName, {
                returnType,
                transferStateKey,
                bsonSerializer,
              });
            }

            const { transferStateKey, bsonSerializer } =
              cache.get(propertyName)!;

            const transferResult = (data: unknown) => {
              transferState.set(transferStateKey, JSON.stringify(data));
              // RangeError: Offset is outside the bounds of the DataView
              // transferState.set(transferStateKey, bsonSerializer(data));
            };

            // TODO: only @rpc.loader() methods should be callable on the server
            return (...args: []) => {
              let result = target[propertyName](...args);

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

  const config: ApplicationConfig = mergeApplicationConfig(APP_CONFIG, {
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
