import 'zone.js';
import { bootstrapApplication } from '@ngkit/client';

import { AppComponent } from './app.component';
import { appConfig } from './app.config';

import.meta.hot?.accept();

void bootstrapApplication(AppComponent, appConfig);
