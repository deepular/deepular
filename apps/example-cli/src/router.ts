import { provideRouter, Routes, ServerController } from '@ngkit/core';

import type { HomeController } from './pages/home/home.controller';

export const router = provideRouter([
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
    resolve: {
      data: (controller: ServerController<HomeController>) =>
        controller.fetchData(),
    },
  },
]);
