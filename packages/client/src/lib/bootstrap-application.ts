import { ClassType } from '@deepkit/core';
import { bootstrapApplication as _bootstrapApplication } from '@angular/platform-browser';
import { Subject, BehaviorSubject } from 'rxjs';
import { RpcWebSocketClient } from '@deepkit/rpc';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ApplicationConfig,
  FactoryProvider,
  mergeApplicationConfig,
  TransferState,
} from '@angular/core';

import {
  CORE_CONFIG,
  getProviderNameForType,
  SignalControllerTypeName,
  ServerControllerTypeName,
  SignalControllerMethod,
} from '@ngkit/core';

import { ClientController } from './client-controller';
import { TransferStateMissingForClientControllerMethodError } from './errors';

export async function bootstrapApplication(
  rootComponent: ClassType,
  controllers: readonly string[] = [],
): Promise<void> {
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

              return async (...args: readonly unknown[]): Promise<unknown> => {
                try {
                  return clientController.getTransferState(propertyName, args);
                } catch (err) {
                  if (
                    err instanceof
                    TransferStateMissingForClientControllerMethodError
                  ) {
                    return await target[propertyName](...args);
                  }
                  throw err;
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
                const loading$ = new BehaviorSubject(false);
                let value$: BehaviorSubject<unknown> | Subject<unknown>;

                const load = async (
                  ...newArgs: readonly unknown[]
                ): Promise<void> => {
                  if (loading$.value) {
                    throw new Error('Already refetching...');
                  }
                  loading$.next(true);
                  const data = newArgs.length
                    ? await target[methodName](...newArgs)
                    : await target[methodName](...args);
                  value$.next(data);
                  loading$.next(false);
                  return data;
                };

                try {
                  const result = clientController.getTransferState(
                    methodName,
                    args,
                  );
                  value$ = new BehaviorSubject(result);
                } catch (err) {
                  if (
                    err instanceof
                    TransferStateMissingForClientControllerMethodError
                  ) {
                    value$ = new Subject();
                    void load(...args);
                  }
                  throw err;
                }

                const value = toSignal(value$.asObservable(), {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  requireSync: value$.constructor.name === BehaviorSubject.name,
                });

                const loading = toSignal(loading$.asObservable(), {
                  requireSync: true,
                });

                const update = (value: unknown) => value$.next(value);

                return { value, loading, refetch: load, update };
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

  const appConfig: ApplicationConfig = mergeApplicationConfig(CORE_CONFIG, {
    providers: [...controllerProviders],
  });

  await _bootstrapApplication(rootComponent, appConfig);
}
