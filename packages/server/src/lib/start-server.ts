/// <reference types="vite/client" />
import { readFile } from 'node:fs/promises';
import { bootstrapApplication } from '@angular/platform-browser';
import { from, tap, Observable, firstValueFrom, catchError, of } from 'rxjs';
import { HttpRouterRegistry, HttpRequest, HtmlResponse } from '@deepkit/http';
import { ApplicationServer, FrameworkModule } from '@deepkit/framework';
import { rpcClass, RpcKernel } from '@deepkit/rpc';
import { BSONSerializer } from '@deepkit/bson';
import { ClassType } from '@deepkit/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RootModuleDefinition } from '@deepkit/app';
import { Logger } from '@deepkit/logger';
import { App } from '@deepkit/app';
import {
  renderApplication,
  provideServerRendering,
  ɵSERVER_CONTEXT as SERVER_CONTEXT,
} from '@angular/platform-server';
import {
  unwrapType,
  CORE_CONFIG,
  getNgKitSerializer,
  makeSerializableStateKey,
  makeSerializedClassTypeStateKey,
  SignalControllerMethod,
  getProviderNameForType,
  SignalControllerTypeName,
  ServerControllerTypeName,
} from '@ngkit/core';
import {
  ReflectionClass,
  resolveRuntimeType,
  SerializedTypes,
  serializeType,
} from '@deepkit/type';
import {
  TransferState,
  ApplicationConfig,
  Provider,
  mergeApplicationConfig,
  signal,
  APP_INITIALIZER,
  Signal,
} from '@angular/core';
import { ngRegisterAppModules } from '@ngkit/injector';

export interface NgKitServerOptions extends RootModuleDefinition {
  readonly publicDir: string;
  readonly documentPath: string;
}

export async function startServer(
  rootComponent: ClassType,
  {
    imports,
    controllers,
    listeners,
    providers,
    workflows,
    middlewares,
    publicDir,
    documentPath,
    ...frameworkOptions
  }: NgKitServerOptions,
  appConfig: ApplicationConfig = { providers: [] },
): Promise<App<any>> {
  const app = new App({
    imports: [
      new FrameworkModule({
        publicDir,
        ...frameworkOptions,
      }),
      ...(imports || []),
    ],
    controllers,
    listeners,
    providers,
    workflows,
    middlewares,
  });
  const router = app.get(HttpRouterRegistry);
  const { controllers: rpcControllers } = app.get(RpcKernel);

  const injector = app.getInjectorContext().createChildScope('rpc');

  const ngControllerProviders: Provider[] = [];
  const rpcControllerSerializedClassTypes = new Map<string, SerializedTypes>(); // SerializedTypeClassType

  for (const [, { controller }] of rpcControllers.entries()) {
    const controllerType = resolveRuntimeType(controller);
    const controllerReflectionClass = ReflectionClass.from(controllerType);
    const instance = injector.get(controller);

    const controllerMetadata = rpcClass._fetch(controller);
    if (!controllerMetadata) {
      throw new Error('Missing controller metadata');
    }

    const controllerName = controllerMetadata.getPath();
    const controllerReflectionMethods = controllerReflectionClass.getMethods();
    const controllerMethodNames = controllerReflectionMethods.map(
      method => method.name,
    );

    rpcControllerSerializedClassTypes.set(
      controllerName,
      serializeType(controllerType),
    );

    const serializers = new Map<string, BSONSerializer>(
      controllerReflectionClass.getMethods().map(method => {
        const returnType = unwrapType(method.getReturnType());
        const serialize = getNgKitSerializer(returnType);
        return [method.name, serialize];
      }),
    );

    const serverControllerProviderName = getProviderNameForType(
      ServerControllerTypeName,
      controllerName,
    );

    ngControllerProviders.push({
      provide: serverControllerProviderName,
      deps: [TransferState],
      useFactory(transferState: TransferState) {
        return new Proxy(instance, {
          get: (target, propertyName: string) => {
            if (!controllerMethodNames.includes(propertyName)) return;

            const serialize = serializers.get(propertyName)!;

            // TODO: only @rpc.loader() methods should be callable on the server
            return async (...args: []): Promise<unknown> => {
              let result = await target[propertyName](...args);

              const transferStateKey = makeSerializableStateKey(
                controllerName,
                propertyName,
                args,
              );

              if (result instanceof Observable) {
                result = await firstValueFrom(result);
              }

              transferState.set(transferStateKey, serialize({ data: result }));

              return result;
            };
          },
        });
      },
    });

    const signalControllerProviderName = getProviderNameForType(
      SignalControllerTypeName,
      controllerName,
    );

    ngControllerProviders.push({
      provide: signalControllerProviderName,
      deps: [TransferState],
      useFactory(transferState: TransferState) {
        return new Proxy(instance, {
          get: (target, propertyName: string) => {
            if (!controllerMethodNames.includes(propertyName)) return;

            const serialize = serializers.get(propertyName)!;

            // TODO: only @rpc.loader() methods should be callable on the server
            return (
              ...args: []
            ): SignalControllerMethod<unknown, unknown[]> => {
              let result = target[propertyName](...args);

              const transferStateKey = makeSerializableStateKey(
                controllerName,
                propertyName,
                args,
              );

              const transferResult = (data: unknown) => {
                transferState.set(transferStateKey, serialize({ data }));
              };

              const isPromise = result instanceof Promise;
              const isObservable = result instanceof Observable;

              const error = signal<Error | null>(null);

              let value: Signal<unknown> | undefined;

              if (!isPromise && !isObservable) {
                transferResult(result);
                value = signal(result);
              }

              if (isPromise) {
                result = from(result);
              }

              if (!value) {
                result = result.pipe(
                  tap(transferResult),
                  catchError(err => {
                    error.set(err);
                    return of(null); // throw error ?
                  }),
                );
                value = toSignal(result, { requireSync: true });
              }

              return {
                refetch: (): never => {
                  throw new Error('Cannot be used on the server');
                },
                update: (): never => {
                  throw new Error('Cannot be used on the server');
                },
                loading: signal(false),
                error,
                value,
              };
            };
          },
        });
      },
    });
  }

  const ngAppInit: Provider = {
    provide: APP_INITIALIZER,
    deps: [TransferState],
    multi: true,
    useFactory(transferState: TransferState) {
      return () => {
        rpcControllerSerializedClassTypes.forEach(
          (serializedClassType, name) => {
            transferState.set(
              makeSerializedClassTypeStateKey(name),
              serializedClassType,
            );
          },
        );
      };
    },
  };

  const finalAppConfig: ApplicationConfig = mergeApplicationConfig(
    CORE_CONFIG,
    {
      providers: [
        provideServerRendering(),
        ngAppInit,
        ngRegisterAppModules,
        ...ngControllerProviders,
      ],
    },
    appConfig,
  );

  const bootstrap = () => bootstrapApplication(rootComponent, finalAppConfig);

  let document: string | undefined;

  router.get('/', async (request: HttpRequest) => {
    if (import.meta.env.PROD) {
      document ||= await readFile(documentPath, 'utf8');
    } else {
      document = await readFile(documentPath, 'utf8');
    }

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

  const logger = app.get(Logger);

  if (import.meta.hot?.data.shuttingDown) {
    logger.alert('Waiting for server to shutdown ...');
    await import.meta.hot.data.shuttingDown;
    import.meta.hot.data.shuttingDown = null;
    import.meta.hot!.data.shuttingDownLogged = null;
  }

  await app.run(['server:start']);

  if (import.meta.hot) {
    const server = app.get(ApplicationServer);

    const dispose = async () => {
      let resolve: () => void;
      import.meta.hot!.data.shuttingDown = new Promise<void>(
        _resolve => (resolve = _resolve),
      );
      if (!import.meta.hot!.data.shuttingDownLogged) {
        logger.alert('Shutting down server ...');
      }
      import.meta.hot!.data.shuttingDownLogged = true;
      await server.close(true);
      resolve!();
    };

    import.meta.hot.on('vite:beforeFullReload', dispose);
    import.meta.hot.on('vite:beforeUpdate', dispose);
  }

  return app;
}
