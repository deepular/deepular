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
  consumerIdx: ControllerConsumerIndex,
) =>
  makeStateKey<T>(
    `${controllerName}#${methodName}(${JSON.stringify(args)})${
      consumerIdx.value
    }`,
  );

export function makeSerializableControllerMethodStateKey(
  controllerName: string,
  methodName: string,
  args: readonly unknown[],
  consumerIdx: ControllerConsumerIndex,
): StateKey<Uint8Array> {
  return makeControllerStateKey(controllerName, methodName, args, consumerIdx);
}

export function makeDeserializableControllerMethodStateKey(
  controllerName: string,
  methodName: string,
  args: readonly unknown[],
  consumerIdx: ControllerConsumerIndex,
): StateKey<{ readonly type: 'Buffer'; readonly data: readonly number[] }> {
  return makeControllerStateKey(controllerName, methodName, args, consumerIdx);
}

export const makeSerializedClassTypeStateKey = (name: string) =>
  makeStateKey<SerializedTypes>(`SerializedClassType[${name}]`);

export class ControllerConsumerIndex {
  constructor(readonly value: number = -1) {}

  next(): ControllerConsumerIndex {
    return new ControllerConsumerIndex(this.value + 1);
  }
}

export const serverControllerConsumerIndex = new ControllerConsumerIndex();

export const signalControllerConsumerIndex = new ControllerConsumerIndex();
