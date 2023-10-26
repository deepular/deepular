import { Signal, StateKey, makeStateKey } from '@angular/core';
import { Observable } from 'rxjs';
import { RemoteController } from '@deepkit/rpc';
import { SerializedTypes } from '@deepkit/type';

type InferObservable<T> = T extends Observable<infer U> ? U : T;

export interface SignalControllerMethod<T, A extends unknown[]> {
  readonly value: Signal<T>;
  readonly update: (value: T) => void;
  readonly loading: Signal<boolean>;
  readonly error: Signal<Error | null>;
  readonly refetch: ((...args: A) => Promise<T>) | (() => Promise<T>);
}

type SignalifyFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => SignalControllerMethod<
  Signal<InferObservable<Awaited<ReturnType<T>>>>,
  Parameters<T>
>;

export type SignalController<T> = T extends string
  ? any
  : {
      [P in keyof T]: T[P] extends (...args: any[]) => any
        ? SignalifyFn<T[P]>
        : never;
    };

export type ServerController<T> = RemoteController<T>;

export const SignalControllerTypeName = 'SignalController';

export const ServerControllerTypeName = 'ServerController';

export type ControllerTypeName =
  | typeof SignalControllerTypeName
  | typeof ServerControllerTypeName;

export const CONTROLLER_TYPE_NAMES = [
  SignalControllerTypeName,
  ServerControllerTypeName,
] as const;

export const isControllerTypeName = (
  name: string,
): name is ControllerTypeName => CONTROLLER_TYPE_NAMES.includes(name as never);

export const makeControllerStateKey = <T>(
  controllerName: string,
  methodName: string,
  args: readonly unknown[],
) =>
  makeStateKey<T>(`${controllerName}#${methodName}(${JSON.stringify(args)})`);

export function makeSerializableControllerMethodStateKey(
  controllerName: string,
  methodName: string,
  args: readonly unknown[],
): StateKey<Uint8Array> {
  return makeControllerStateKey(controllerName, methodName, args);
}

export function makeDeserializableControllerMethodStateKey(
  controllerName: string,
  methodName: string,
  args: readonly unknown[],
): StateKey<{ readonly type: 'Buffer'; readonly data: readonly number[] }> {
  return makeControllerStateKey(controllerName, methodName, args);
}

export const makeSerializedClassTypeStateKey = (name: string) =>
  makeStateKey<SerializedTypes>(`SerializedClassType[${name}]`);

export function makeRuntimeControllerProviderToken() {}
