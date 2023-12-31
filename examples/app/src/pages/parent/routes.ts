import { Routes } from '@deepular/core';

import { ParentComponent } from './parent.component';

export const routes: Routes = [
  {
    path: 'child',
    component: ParentComponent,
    loadChildren: () => import('./child/routes').then(m => m.routes),
  }
];

