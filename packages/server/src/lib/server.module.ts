import { AppModule, ControllerConfig, createModule } from '@deepkit/app';
import { InjectorContext, InjectorModule } from '@deepkit/injector';
import {
  APP_INITIALIZER,
  ApplicationConfig,
  mergeApplicationConfig,
  Provider,
  Signal,
  signal,
  TransferState,
} from '@angular/core';
import {
  CORE_CONFIG,
  getNgKitSerializer,
  getProviderNameForType,
  makeSerializableControllerMethodStateKey,
  makeSerializedClassTypeStateKey,
  ServerControllerTypeName,
  SignalControllerMethod,
  SignalControllerTypeName,
  unwrapType,
} from '@ngkit/core';
import { provideServerRendering } from '@angular/platform-server';
import {
  ReflectionClass,
  resolveRuntimeType,
  SerializedTypes,
  serializeType,
} from '@deepkit/type';
import { rpcClass } from '@deepkit/rpc';
import { BSONSerializer } from '@deepkit/bson';
import { catchError, firstValueFrom, from, Observable, of, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClassType } from '@deepkit/core';

import { ServerConfig } from './config';
import { ServerListener } from './server-listener';

type ControllerMetadata = NonNullable<ReturnType<(typeof rpcClass)['_fetch']>>;

export class ServerModule extends createModule({
  config: ServerConfig,
  listeners: [ServerListener],
  forRoot: true,
}) {
  readonly rpcControllers = new Set<{
    module: AppModule;
    controller: ClassType;
    metadata: ControllerMetadata;
  }>();
  readonly ngControllerProviders = new Set<Provider>();
  readonly rpcControllerSerializedClassTypes = new Map<
    string,
    SerializedTypes
  >();

  override postProcess() {
    this.rpcControllers.forEach(({ module, controller, metadata }) => {
      const controllerType = resolveRuntimeType(controller);
      const controllerReflectionClass = ReflectionClass.from(controllerType);

      const controllerName = metadata.getPath();
      const controllerReflectionMethods =
        controllerReflectionClass.getMethods();
      const controllerMethodNames = controllerReflectionMethods.map(
        method => method.name,
      );

      const injector = new InjectorContext(module).createChildScope('rpc');

      this.rpcControllerSerializedClassTypes.set(
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

      this.ngControllerProviders.add({
        provide: serverControllerProviderName,
        deps: [TransferState],
        useFactory: (transferState: TransferState) => {
          const instance = injector.get(controllerType);
          return new Proxy(instance, {
            get: (
              target: typeof instance,
              propertyName: keyof typeof instance,
            ) => {
              if (!controllerMethodNames.includes(propertyName)) return;

              const serialize = serializers.get(propertyName)!;

              // TODO: only @rpc.loader() methods should be callable on the server
              return async (...args: []): Promise<unknown> => {
                let result = await target[propertyName](...args);

                const transferStateKey =
                  makeSerializableControllerMethodStateKey(
                    controllerName,
                    propertyName,
                    args,
                  );

                if (result instanceof Observable) {
                  result = await firstValueFrom(result);
                }

                transferState.set(
                  transferStateKey,
                  serialize({ data: result }),
                );

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

      this.ngControllerProviders.add({
        provide: signalControllerProviderName,
        deps: [TransferState],
        useFactory(transferState: TransferState) {
          const instance = injector.get(controllerType);
          return new Proxy(instance, {
            get: (
              target: typeof instance,
              propertyName: keyof typeof instance,
            ) => {
              if (!controllerMethodNames.includes(propertyName)) return;

              const serialize = serializers.get(propertyName)!;

              // TODO: only @rpc.loader() methods should be callable on the server
              return (
                ...args: []
              ): SignalControllerMethod<unknown, unknown[]> => {
                let result = target[propertyName](...args);

                const transferStateKey =
                  makeSerializableControllerMethodStateKey(
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
                      return of(null);
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
    });

    const ngAppInit: Provider = {
      provide: APP_INITIALIZER,
      deps: [TransferState],
      multi: true,
      useFactory: (transferState: TransferState) => {
        return () => {
          this.rpcControllerSerializedClassTypes.forEach(
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

    const serverConfig: ApplicationConfig = {
      providers: [
        provideServerRendering(),
        ngAppInit,
        ...this.ngControllerProviders,
      ],
    };

    const finalAppConfig = this.config.app
      ? mergeApplicationConfig(CORE_CONFIG, serverConfig, this.config.app)
      : mergeApplicationConfig(CORE_CONFIG, serverConfig);

    this.configure({ app: finalAppConfig });
  }

  override processController(
    module: AppModule<never>,
    { controller }: ControllerConfig,
  ) {
    if (!controller) return;

    const controllerMetadata = rpcClass._fetch(controller);
    if (!controllerMetadata) return;

    this.rpcControllers.add({
      module,
      controller,
      metadata: controllerMetadata,
    });
  }
}
