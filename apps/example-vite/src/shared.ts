import { NgKitControllerSymbol } from '@ngkit/core';

export interface AppControllerApi {
  count(): number;
}

export const AppControllerApi = NgKitControllerSymbol<AppControllerApi>(
  'AppController',
  [],
);
