import { StateKey, makeStateKey } from '@angular/core';
import { SerializedTypes } from '@deepkit/type';

export const makeNgKitStateKey = <T>(
  controllerName: string,
  methodName: string,
  args: unknown[],
) =>
  makeStateKey<T>(`${controllerName}.${methodName}(${JSON.stringify(args)})`);

export function makeSerializableStateKey(
  controllerName: string,
  methodName: string,
  args: unknown[],
): StateKey<Uint8Array> {
  return makeNgKitStateKey(controllerName, methodName, args);
}

export function makeDeserializableStateKey(
  controllerName: string,
  methodName: string,
  args: unknown[],
): StateKey<{ readonly type: 'Buffer'; readonly data: readonly number[] }> {
  return makeNgKitStateKey(controllerName, methodName, args);
}

export const makeSerializedClassTypeStateKey = (name: string) =>
  makeStateKey<SerializedTypes>(`SerializedClassType[${name}]`);

export const SERIALIZED_CLASS_TYPES_STATE_KEY = makeStateKey<
  readonly SerializedTypes[]
>(`SERIALIZED_CLASS_TYPES_STATE_KEY`);
