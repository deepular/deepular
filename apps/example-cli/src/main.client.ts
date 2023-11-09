import 'zone.js';
import { bootstrapApplication } from '@ngkit/client';

import { AppComponent } from './app.component';
import { routes } from './routes';

import.meta.hot?.accept();

void bootstrapApplication(AppComponent, {
  routes
});
