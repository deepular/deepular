import { StateKey, makeStateKey } from '@angular/core';
import { SerializedTypes } from '@deepkit/type';

export const makeNgKitStateKey = <T>(
  controllerName: string,
  methodName: string,
  args: readonly unknown[],
) =>
  makeStateKey<T>(`${controllerName}#${methodName}(${JSON.stringify(args)})`);

export function makeSerializableStateKey(
  controllerName: string,
  methodName: string,
  args: readonly unknown[],
): StateKey<Uint8Array> {
  return makeNgKitStateKey(controllerName, methodName, args as unknown[]);
}

export function makeDeserializableStateKey(
  controllerName: string,
  methodName: string,
  args: readonly unknown[],
): StateKey<{ readonly type: 'Buffer'; readonly data: readonly number[] }> {
  return makeNgKitStateKey(controllerName, methodName, args as unknown[]);
}

export const makeSerializedClassTypeStateKey = (name: string) =>
  makeStateKey<SerializedTypes>(`SerializedClassType[${name}]`);
