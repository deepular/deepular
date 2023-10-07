import { ClassType } from '@deepkit/core';
import { bootstrapApplication as _bootstrapApplication } from '@angular/platform-browser';

import { APP_CONFIG, makeNgKitStateKey, NgKitControllerDefinition } from '@ngkit/core';
import { ApplicationConfig, mergeApplicationConfig, signal, TransferState } from '@angular/core';
import { RpcWebSocketClient } from '@deepkit/rpc';
import { toSignal } from '@angular/core/rxjs-interop';

export async function bootstrapApplication(
  rootComponent: ClassType,
  controllerDefinitions: NgKitControllerDefinition<unknown>[] = [],
): Promise<void> {
  const client = new RpcWebSocketClient();

  const providers = controllerDefinitions.map(controllerDefinition => ({
    provide: controllerDefinition._token,
    deps: [TransferState],
    useFactory(transferState: TransferState) {
      const remoteController = client.controller(controllerDefinition, { dontWaitForConnection: true });

      return new Proxy(remoteController, {
        get: (target, propertyName: string) => {
          const transferStateKey = makeNgKitStateKey(
            controllerDefinition.path,
            propertyName,
          );

          // TODO: transfer key should include args
          return (...args) => {
            if (transferState.hasKey(transferStateKey)) {
              return signal(transferState.get(transferStateKey));
            }

            return toSignal(from(target[propertyName](...args)));
          }
        }
      });
    }
  }));

  const appConfig: ApplicationConfig = mergeApplicationConfig(APP_CONFIG, {
    providers,
  });

  await _bootstrapApplication(rootComponent, appConfig);
}
