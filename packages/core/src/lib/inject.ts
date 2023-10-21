import { inject as ngInject, ProviderToken } from '@angular/core';
import { ReceiveType, resolveReceiveType, stringifyType } from '@deepkit/type';

export function inject<T>(token?: ProviderToken<T>, type?: ReceiveType<T>): T {
  if (!token) {
    type = resolveReceiveType(type);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    token = stringifyType(type) as any;
  }

  return ngInject(token!);
}
