import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@ngkit/core';

import { HomeResolver } from './pages/home/home.resolver';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([
      {
        path: '/home',
        loadComponent: () =>
          import('./pages/home/home.component').then(m => m.HomeComponent),
        resolve: {
          data: HomeResolver,
        },
      },
    ]),
  ],
};
