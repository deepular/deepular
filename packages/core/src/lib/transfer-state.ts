import { StateKey, makeStateKey } from '@angular/core';

export function makeNgKitStateKey<T>(
  instanceName: string,
  methodName: string,
): StateKey<T> {
  return makeStateKey(`${instanceName}#${methodName}`);
}
