import { provideRouter, Routes, ServerController } from '@ngkit/core';

import type { ServerControllerResolverController } from './pages/server-controller-resolver/server-controller-resolver.controller';

export const router = provideRouter([
  {
    path: 'server-controller-resolver',
    loadComponent: () =>
      import('./pages/server-controller-resolver/server-controller-resolver.component').then(m => m.ServerControllerResolverComponent),
    resolve: {
      data: (controller: ServerController<ServerControllerResolverController>) =>
        controller.fetch(),
    },
  },
  {
    path: 'parent',
    loadChildren: () => import('./pages/parent/routes').then(m => m.routes),
  }
]);
