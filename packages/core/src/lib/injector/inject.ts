import { inject as ngInject, ProviderToken } from '@angular/core';
import { ReceiveType, resolveReceiveType } from '@deepkit/type';

export function inject<T>(token?: ProviderToken<T>, type?: ReceiveType<T>): T {
  if (!token) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    token = type = resolveReceiveType(type) as any;
  }

  return ngInject(token!);
}
