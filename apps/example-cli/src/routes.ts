import { Routes } from '@ngkit/core';

import { HomeResolver } from './pages/home/home.resolver';

export const routes: Routes = [
  {
    path: '/home',
    loadComponent: () =>
      import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [],
    resolve: {
      data: HomeResolver,
      // data: (home: ServerController<HomeController>, route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => home.fetchData(),
    },
  },
];
