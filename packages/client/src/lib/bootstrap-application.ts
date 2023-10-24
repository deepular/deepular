import { bootstrapApplication as _bootstrapApplication } from '@angular/platform-browser';
import { Subject, BehaviorSubject } from 'rxjs';
import { RpcWebSocketClient } from '@deepkit/rpc';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ApplicationConfig,
  FactoryProvider,
  ɵNG_COMP_DEF,
  mergeApplicationConfig,
  TransferState,
  ɵComponentDef,
  ChangeDetectorRef,
  inject,
  signal,
  Type,
} from '@angular/core';

import {
  setupRootInjector,
  CORE_CONFIG,
  getProviderNameForType,
  SignalControllerTypeName,
  ServerControllerTypeName,
  SignalControllerMethod,
} from '@ngkit/core';

import { ClientController } from './client-controller';
import { TransferStateMissingForClientControllerMethodError } from './errors';

export async function bootstrapApplication<T>(
  rootComponent: Type<T>,
  controllers: readonly string[] = [],
  appConfig: ApplicationConfig = { providers: [] },
): Promise<void> {
  setupRootInjector(rootComponent);

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const client = new RpcWebSocketClient(`${protocol}//${window.location.host}`);

  const controllerProviders = controllers.flatMap<FactoryProvider>(
    controllerName => {
      const remoteController = client.controller(controllerName);

      const clientControllerProvider: FactoryProvider = {
        provide: getProviderNameForType(ClientController.name, controllerName),
        deps: [TransferState],
        useFactory: (transferState: TransferState) =>
          new ClientController(controllerName, transferState),
      };

      const serverControllerName = getProviderNameForType(
        ServerControllerTypeName,
        controllerName,
      );

      const serverControllerProvider: FactoryProvider = {
        provide: serverControllerName,
        deps: [clientControllerProvider.provide],
        useFactory(clientController: ClientController) {
          return new Proxy(remoteController, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            get(target: any, propertyName: string): any {
              if (!clientController.methodNames.includes(propertyName)) return;

              let transferStateUsed: boolean = false;

              return async (...args: readonly unknown[]): Promise<unknown> => {
                const execute = () => target[propertyName](...args);

                if (transferStateUsed) return await execute();

                try {
                  return clientController.getTransferState(propertyName, args);
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

      const signalControllerName = getProviderNameForType(
        SignalControllerTypeName,
        controllerName,
      );

      const signalControllerProvider: FactoryProvider = {
        provide: signalControllerName,
        deps: [clientControllerProvider.provide],
        useFactory(clientController: ClientController) {
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

      return [
        clientControllerProvider,
        serverControllerProvider,
        signalControllerProvider,
      ];
    },
  );

  const finalAppConfig: ApplicationConfig = mergeApplicationConfig(
    CORE_CONFIG,
    {
      providers: [...controllerProviders],
    },
    appConfig,
  );

  // const refetchers = import.meta.hot?.data.refetchers;

  if (import.meta.hot) {
    // import.meta.hot.data.refetchers = [];
    import.meta.hot.data.destroy?.();
    delete import.meta.hot.data.destroy;
  }

  const appRef = await _bootstrapApplication(rootComponent, finalAppConfig);

  if (import.meta.hot) {
    import.meta.hot!.data.refetch = false;

    // refetchers?.forEach((refetch: () => void) => refetch());

    const cmpDef = rootComponent[
      ɵNG_COMP_DEF as keyof typeof rootComponent
    ] as ɵComponentDef<T>;
    const cmpSelector = cmpDef.selectors[0][0];
    if (typeof cmpSelector !== 'string') {
      throw new Error(`${rootComponent.name} selector must be an element`);
    }

    const dispose = async () => {
      import.meta.hot!.data.destroy = () => {
        try {
          import.meta.hot!.data.refetch = true;
          appRef.destroy();
        } catch {
          /* empty */
        }
        if (!document.body.querySelector(cmpSelector)) {
          document.body.appendChild(document.createElement(cmpSelector));
        }
      };
    };

    import.meta.hot.on('vite:beforeFullReload', dispose);
    import.meta.hot.on('vite:beforeUpdate', dispose);
  }
}
