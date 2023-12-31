import { Routes } from '@deepular/core';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./child.component').then(m => m.ChildComponent),
  }
];
