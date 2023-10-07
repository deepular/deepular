import { NgKitControllerDefinition, RemoteController } from '@ngkit/core';

export type AppController = RemoteController<AppControllerApi>;

export const AppControllerApi = new NgKitControllerDefinition<AppControllerApi>(
  'AppController',
  [],
);

export interface AppControllerApi {
  count(): number;
}
