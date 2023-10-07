import { ClassType } from '@deepkit/core';
import { bootstrapApplication as _bootstrapApplication } from '@angular/platform-browser';
import { from } from 'rxjs';
import {
  ApplicationConfig,
  mergeApplicationConfig,
  signal,
  TransferState,
} from '@angular/core';
import { RpcWebSocketClient } from '@deepkit/rpc';
import { toSignal } from '@angular/core/rxjs-interop';
import { deserializeType, ReflectionClass } from '@deepkit/type';

import {
  CORE_CONFIG,
  getNgKitDeserializer,
  makeDeserializableStateKey,
  makeSerializableStateKey,
  makeSerializedClassTypeStateKey,
  NgKitDeserializer,
  unwrapType,
} from '@ngkit/core';

export async function bootstrapApplication(
  rootComponent: ClassType,
  controllers: readonly string[] = [],
): Promise<void> {
  const client = new RpcWebSocketClient('http://localhost:8080');

  const providers = controllers.map(controllerName => ({
    provide: controllerName,
    deps: [TransferState],
    useFactory(transferState: TransferState) {
      const serializedClassType = transferState.get(
        makeSerializedClassTypeStateKey(controllerName),
        null,
      );
      if (!serializedClassType) {
        throw new Error(`Missing serialized class type for ${controllerName}`);
      }
      const controllerType = deserializeType(serializedClassType);

      const remoteController = client.controller(controllerName, {
        dontWaitForConnection: true,
      });

      const controllerReflectionClass = ReflectionClass.from(controllerType);

      const controllerReflectionMethods =
        controllerReflectionClass.getMethods();
      const controllerMethodNames = controllerReflectionMethods.map(
        method => method.name,
      );

      const deserializers = new Map<string, NgKitDeserializer<unknown>>(
        controllerReflectionClass.getMethods().map(method => {
          const returnType = unwrapType(method.getReturnType());
          const deserialize = getNgKitDeserializer(returnType);
          return [method.name, deserialize];
        }),
      );

      return new Proxy(remoteController, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        get: (target: any, propertyName: string) => {
          if (!controllerMethodNames.includes(propertyName)) return;

          const deserialize = deserializers.get(propertyName)!;

          return (...args: unknown[]) => {
            const transferStateKey = makeDeserializableStateKey(
              controllerName,
              propertyName,
              args,
            );

            if (transferState.hasKey(transferStateKey)) {
              const transferStateValue = transferState.get(
                transferStateKey,
                null,
              );
              if (!transferStateValue) {
                throw new Error('Something went wrong');
              }
              transferState.remove(transferStateKey);
              const bson = new Uint8Array(transferStateValue.data);
              const { data } = deserialize(bson);

              return signal(data);
            }

            return toSignal(from(target[propertyName](...args)), {
              requireSync: true,
            });
          };
        },
      });
    },
  }));

  const appConfig: ApplicationConfig = mergeApplicationConfig(CORE_CONFIG, {
    providers,
  });

  await _bootstrapApplication(rootComponent, appConfig);
}
