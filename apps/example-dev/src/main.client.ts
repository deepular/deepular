import 'zone.js';
import { bootstrapApplication } from '@ngkit/client';

import { AppComponent } from './app.component';

import.meta.hot?.accept();

void bootstrapApplication(AppComponent, ['AppController']);
