import {
  ControllersModule,
  ServerController,
  makeSerializableControllerMethodStateKey,
  serverControllerConsumerIndex,
  SignalController,
  signalControllerConsumerIndex,
  SignalControllerMethod,
} from '@ngkit/core';
import { Signal, signal, TransferState } from '@angular/core';
import { Type } from '@deepkit/type';
import { FactoryProvider } from '@deepkit/injector';
import {
  catchError,
  finalize,
  firstValueFrom,
  from,
  Observable,
  of,
  tap,
} from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { ClassType } from '@deepkit/core';

import { InternalServerController } from './internal-server-controller';

import { ServerModule } from './server.module';
import { RpcController } from './types';

export class ServerControllersModule extends ControllersModule {
  private rpcControllers: ReadonlyMap<string, RpcController>;

  constructor(private readonly serverModule: ServerModule) {
    super();
  }

  getInternalServerController(type: ClassType): InternalServerController {
    return this.injector!.get<InternalServerController>(
      InternalServerController.getProviderToken(type),
    );
  }

  protected addServerController(
    serverControllerType: Type,
    controllerName: string,
  ): void {
    const { controller: controllerType, injector } =
      this.rpcControllers.get(controllerName)!;

    const serverControllerProvider: FactoryProvider<ServerController<unknown>> =
      {
        provide: serverControllerType,
        transient: true,
        useFactory: (transferState: TransferState) => {
          const controller = injector.get(controllerType);
          const internalServerController =
            this.getInternalServerController(controllerType);
          const consumerIndex = serverControllerConsumerIndex.next();

          return new Proxy(controller, {
            get: (target: typeof controller, propertyName: string) => {
              if (!internalServerController.methodNames.includes(propertyName))
                return;

              const serialize =
                internalServerController.serializers.get(propertyName)!;

              // TODO: only @rpc.loader() methods should be callable on the server
              return async (...args: []): Promise<unknown> => {
                let result = await target[propertyName](...args);

                const transferStateKey =
                  makeSerializableControllerMethodStateKey(
                    controllerName,
                    propertyName,
                    args,
                    consumerIndex,
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
      };

    this.addProvider(serverControllerProvider);
    this.addExport(serverControllerProvider);
  }

  protected addSignalController(
    signalControllerType: Type,
    controllerName: string,
  ): void {
    const { controller: controllerType, injector } =
      this.rpcControllers.get(controllerName)!;

    const signalControllerProvider: FactoryProvider<SignalController<unknown>> =
      {
        provide: signalControllerType,
        transient: true,
        useFactory: (transferState: TransferState) => {
          const controller = injector.get(controllerType);
          const internalServerController =
            this.getInternalServerController(controllerType);
          const consumerIndex = signalControllerConsumerIndex.next();

          return new Proxy(controller, {
            get: (target: typeof controller, propertyName: string) => {
              if (!internalServerController.methodNames.includes(propertyName))
                return;

              const serialize =
                internalServerController.serializers.get(propertyName)!;

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
                    consumerIndex,
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

                const loading = signal(!value);

                if (!value) {
                  result = result.pipe(
                    tap(transferResult),
                    catchError(err => {
                      error.set(err);
                      return of(null);
                    }),
                    finalize(() => loading.set(false)),
                  );
                  value = toSignal(result);
                }

                return {
                  refetch: (): never => {
                    throw new Error('Cannot be used on the server');
                  },
                  update: (): never => {
                    throw new Error('Cannot be used on the server');
                  },
                  loading,
                  error,
                  value,
                };
              };
            },
          });
        },
      };

    this.addProvider(signalControllerProvider);
    this.addExport(signalControllerProvider);
  }

  override postProcess() {
    this.rpcControllers = new Map(
      [...this.serverModule.rpcControllers].map(controller => [
        controller.controller.name,
        controller,
      ]),
    );

    this.rpcControllers.forEach(({ controller }) => {
      const serverControllerProvider: FactoryProvider<InternalServerController> =
        {
          provide: InternalServerController.getProviderToken(controller),
          useFactory: () => new InternalServerController(controller),
        };
      this.addProvider(serverControllerProvider);
      this.addExport(serverControllerProvider);
    });

    super.postProcess();
  }
}
