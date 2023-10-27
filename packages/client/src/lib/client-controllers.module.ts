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
import { TransferStateMissingForClientControllerMethodError } from './errors';

export class ClientControllersModule extends ControllersModule {
  constructor(private readonly client: RpcClient) {
    super();
  }

  getRemoteController<T>(type: TypeClass): RemoteController<T> {
    return this.injector!.get(type) as RemoteController<T>;
  }

  getInternalClientController(type: TypeClass): InternalClientController {
    return this.injector!.get<InternalClientController>(
      InternalClientController.getProviderToken(type),
    );
  }

  protected addServerController(
    signalControllerType: Type,
    controllerType: TypeClass,
  ): void {
    const serverControllerProvider: FactoryProvider<ServerController<unknown>> =
      {
        provide: signalControllerType,
        transient: true,
        useFactory: () => {
          const clientController =
            this.getInternalClientController(controllerType);
          const remoteController = this.getRemoteController(controllerType);
          const consumerIdx = serverControllerConsumerIndex.next();
          return new Proxy(remoteController, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            get(target: any, propertyName: string): any {
              if (!clientController.methodNames.includes(propertyName)) return;

              let transferStateUsed: boolean = false;

              return async (...args: readonly unknown[]): Promise<unknown> => {
                const execute = () => target[propertyName](...args);

                if (transferStateUsed) return await execute();

                try {
                  return clientController.getTransferState(
                    propertyName,
                    args,
                    consumerIdx,
                  );
                } catch (err) {
                  if (
                    err instanceof
                    TransferStateMissingForClientControllerMethodError
                  ) {
                    return await execute();
                  }
                  throw err;
                } finally {
                  if (!transferStateUsed) {
                    transferStateUsed = true;
                  }
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
    controllerType: TypeClass,
  ): void {
    const signalControllerProvider: FactoryProvider<SignalController<unknown>> =
      {
        provide: signalControllerType,
        transient: true,
        useFactory: () => {
          const clientController =
            this.getInternalClientController(controllerType);
          const remoteController = this.getRemoteController(controllerType);
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
                let transferStateUsed: boolean = false;

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

                if (!transferStateUsed) {
                  try {
                    const result = clientController.getTransferState(
                      methodName,
                      args,
                      consumerIdx,
                    );
                    transferStateUsed = true;
                    value$ = new BehaviorSubject(result);
                  } catch (err) {
                    if (
                      err instanceof
                      TransferStateMissingForClientControllerMethodError
                    ) {
                      void load(...args);
                    } else {
                      throw err;
                    }
                  }
                } else {
                  void load(...args);
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
    for (const controllerType of this.controllerTypes) {
      const controllerName = controllerType.typeName!;

      const remoteControllerProvider: FactoryProvider<
        RemoteController<unknown>
      > = {
        provide: controllerType,
        useFactory: () => this.client.controller(controllerType.typeName!),
      };
      this.addProvider(remoteControllerProvider);
      this.addExport(remoteControllerProvider);

      const clientControllerProvider: FactoryProvider<InternalClientController> =
        {
          provide: InternalClientController.getProviderToken(controllerType),
          useFactory: (transferState: TransferState) =>
            new InternalClientController(controllerName, transferState),
        };
      this.addProvider(clientControllerProvider);
      this.addExport(clientControllerProvider);
    }

    super.postProcess();
  }
}
