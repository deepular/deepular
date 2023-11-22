import {
  ServerController,
  serverControllerConsumerIndex,
  SignalController,
  signalControllerConsumerIndex,
  SignalControllerMethod,
  ControllersModule, provideNgDependency,
} from '@ngkit/core';
import { RpcClient, RemoteController } from '@deepkit/rpc';
import { FactoryProvider } from '@deepkit/injector';
import {
  ApplicationRef,
  ChangeDetectorRef, DestroyRef,
  inject,
  signal,
  TransferState,
} from '@angular/core';
import { Type } from '@deepkit/type';
import { BehaviorSubject, Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { InternalClientController } from './internal-client-controller';
import { ApplicationStable } from './application-stable';

export class ClientControllersModule extends ControllersModule {
  constructor(private readonly client: RpcClient) {
    super();
  }

  create(): ClientControllersModule {
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
            get(target: any, methodName: string): any {
              if (!clientController.methodNames.includes(methodName)) return;

              return async (...args: readonly unknown[]): Promise<unknown> => {
                if (clientController.useTransferState(methodName, args, consumerIdx)) {
                  return clientController.getTransferState(
                    methodName,
                    args,
                    consumerIdx,
                  );
                }

                return await target[methodName](...args);
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

                if (clientController.useTransferState(methodName, args, consumerIdx)) {
                  const result = clientController.getTransferState(
                    methodName,
                    args,
                    consumerIdx,
                  );
                  value$ = new BehaviorSubject(result);
                } else {
                  void load(...args);
                }

                const value = toSignal(value$.asObservable(), {
                  // @ts-expect-error types mismatch
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
    this.addProvider(
      provideNgDependency(ApplicationRef),
      provideNgDependency(DestroyRef),
    );
    this.addProvider(ApplicationStable)

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
          useFactory: (transferState: TransferState, appStable: ApplicationStable) =>
            new InternalClientController(controllerName, transferState, appStable),
        };
      this.addProvider(clientControllerProvider);
      this.addExport(clientControllerProvider);
    }

    super.postProcess();
  }
}
