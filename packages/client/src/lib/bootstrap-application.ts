import { ClassType } from '@deepkit/core';
import { bootstrapApplication as _bootstrapApplication } from '@angular/platform-browser';
import { from, Subject, BehaviorSubject } from 'rxjs';
import {
  ApplicationConfig,
  mergeApplicationConfig,
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
  SERIALIZED_CLASS_TYPES_STATE_KEY,
  ServerControllerMethod,
  unwrapType,
} from '@ngkit/core';

export async function bootstrapApplication(
  rootComponent: ClassType,
  controllers: readonly string[] = [],
): Promise<void> {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const client = new RpcWebSocketClient(`${protocol}//${window.location.host}`);

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

      const remoteController = client.controller(controllerName);

      const controllerReflectionClass = ReflectionClass.from(controllerType);

      const controllerReflectionMethods =
        controllerReflectionClass.getMethods();
      const controllerMethodNames = controllerReflectionMethods.map(
        method => method.name,
      );

      const deserializers = new Map<string, NgKitDeserializer<any>>(
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

          return (
            ...args: unknown[]
          ): ServerControllerMethod<unknown, unknown[]> => {
            const loading$ = new BehaviorSubject(false);
            let value$: BehaviorSubject<unknown> | Subject<unknown>;

            const transferStateKey = makeDeserializableStateKey(
              controllerName,
              propertyName,
              args,
            );

            const load = async (...newArgs: unknown[]): Promise<void> => {
              if (loading$.value) {
                throw new Error('Already refetching...');
              }
              loading$.next(true);
              const data = newArgs.length
                ? await target[propertyName](...newArgs)
                : await target[propertyName](...args);
              value$.next(data);
              loading$.next(false);
              return data;
            };

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

              value$ = new BehaviorSubject(data);
            } else {
              value$ = new Subject();
              void load(...args);
            }

            const value = toSignal(value$.asObservable(), {
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
  }));

  const appConfig: ApplicationConfig = mergeApplicationConfig(CORE_CONFIG, {
    providers,
  });

  await _bootstrapApplication(rootComponent, appConfig);
}
