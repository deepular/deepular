import {
  getProviderNameForType,
  ServerController,
  serverControllerConsumerIndex,
  SignalController,
  signalControllerConsumerIndex,
  SignalControllerMethod,
  ControllersModule,
} from '@ngkit/core';
import { RpcClient, RemoteController } from '@deepkit/rpc';
import { FactoryProvider } from '@deepkit/injector';
import {
  ChangeDetectorRef,
  inject,
  signal,
  TransferState,
} from '@angular/core';
import { Type, TypeClass } from '@deepkit/type';
import { BehaviorSubject, Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { InternalClientController } from './internal-client-controller';
import { TransferStateMissingForClientControllerMethodException } from './errors';

export class ClientControllersModule extends ControllersModule {
  constructor(private readonly client: RpcClient) {
    super();
  }

  clone(): ClientControllersModule {
    return new ClientControllersModule(this.client);
  }

  getRemoteController<T>(name: string): RemoteController<T> {
    return this.injector!.get(name) as RemoteController<T>;
  }

  getInternalClientController(name: string): InternalClientController {
    return this.injector!.get<InternalClientController>(
      InternalClientController.getProviderToken(name),
    );
  }

  protected addServerController(
    signalControllerType: Type,
    controllerName: string,
  ): void {
    const serverControllerProvider: FactoryProvider<ServerController<unknown>> =
      {
        provide: signalControllerType,
        transient: true,
        useFactory: () => {
          const clientController =
            this.getInternalClientController(controllerName);
          const remoteController = this.getRemoteController(controllerName);
          const consumerIdx = serverControllerConsumerIndex.next();

          return new Proxy(remoteController, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            get(target: any, propertyName: string): any {
              if (!clientController.methodNames.includes(propertyName)) return;

              return async (...args: readonly unknown[]): Promise<unknown> => {
                const execute = () => target[propertyName](...args);

                try {
                  return clientController.getTransferState(
                    propertyName,
                    args,
                    consumerIdx,
                  );
                } catch (err) {
                  if (
                    err instanceof
                    TransferStateMissingForClientControllerMethodException
                  ) {
                    return await execute();
                  }
                  throw err;
                }
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
    const signalControllerProvider: FactoryProvider<SignalController<unknown>> =
      {
        provide: signalControllerType,
        transient: true,
        useFactory: () => {
          const clientController =
            this.getInternalClientController(controllerName);
          const remoteController = this.getRemoteController(controllerName);
          const consumerIdx = signalControllerConsumerIndex.next();

          return new Proxy(remoteController, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            get: (target: any, methodName: string) => {
              if (!clientController.methodNames.includes(methodName)) return;

              return (
                ...args: readonly unknown[]
              ): SignalControllerMethod<unknown, unknown[]> => {
                const loading = signal<boolean>(false);
                const error = signal<Error | null>(null);
                let value$: Subject<unknown> | BehaviorSubject<unknown> =
                  new Subject<unknown>();

                const changeDetectorRef = inject(ChangeDetectorRef);
                // TODO: we need current component reference
                // const componentRef = inject(ComponentRef);
                // console.log(componentRef);

                const load = async (
                  ...newArgs: readonly unknown[]
                ): Promise<void> => {
                  if (loading()) {
                    throw new Error('Already refetching...');
                  }
                  try {
                    loading.set(true);
                    changeDetectorRef.detectChanges();
                    const data = newArgs.length
                      ? await target[methodName](...newArgs)
                      : await target[methodName](...args);
                    if (error()) {
                      error.set(null);
                    }
                    value$.next(data);
                    return data;
                  } catch (err) {
                    error.set(err as Error);
                  } finally {
                    loading.set(false);
                    changeDetectorRef.detectChanges();
                  }
                };

                try {
                  const result = clientController.getTransferState(
                    methodName,
                    args,
                    consumerIdx,
                  );
                  value$ = new BehaviorSubject(result);
                } catch (err) {
                  if (
                    err instanceof
                    TransferStateMissingForClientControllerMethodException
                  ) {
                    void load(...args);
                  } else {
                    throw err;
                  }
                }

                const value = toSignal(value$.asObservable(), {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  requireSync: value$.constructor.name === BehaviorSubject.name,
                });

                const update = (value: unknown) => value$.next(value);

                // if (import.meta.hot) {
                //   import.meta.hot.data.refetchers.push(() => load());
                // }

                return { value, error, loading, refetch: load, update };
              };
            },
          });
        },
      };

    this.addProvider(signalControllerProvider);
    this.addExport(signalControllerProvider);
  }

  override postProcess() {
    for (const controllerName of this.controllerNames) {
      const remoteControllerProvider: FactoryProvider<
        RemoteController<unknown>
      > = {
        provide: controllerName,
        useFactory: () => this.client.controller(controllerName),
      };
      this.addProvider(remoteControllerProvider);
      this.addExport(remoteControllerProvider);

      const clientControllerProvider: FactoryProvider<InternalClientController> =
        {
          provide: InternalClientController.getProviderToken(controllerName),
          useFactory: (transferState: TransferState) =>
            new InternalClientController(controllerName, transferState),
        };
      this.addProvider(clientControllerProvider);
      this.addExport(clientControllerProvider);
    }

    super.postProcess();
  }
}
