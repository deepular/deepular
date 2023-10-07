import { StateKey, makeStateKey } from '@angular/core';

export const makeNgKitStateKey = <T>(
  instance: string,
  method: string,
  args: unknown[],
) => makeStateKey<T>(`${instance}.${method}(${JSON.stringify(args)})`);

export function makeSerializableStateKey(
  instance: string,
  method: string,
  args: unknown[],
): StateKey<Uint8Array> {
  return makeNgKitStateKey(instance, method, args);
}

export function makeDeserializableStateKey(
  instance: string,
  method: string,
  args: unknown[],
): StateKey<{ readonly type: 'Buffer'; readonly data: readonly number[] }> {
  return makeNgKitStateKey(instance, method, args);
}
