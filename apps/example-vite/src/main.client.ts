import 'zone.js';
import { bootstrapClientApplication } from '@ngkit/client';

import { AppComponent } from './app.component';

void bootstrapClientApplication(AppComponent, ['AppController']);
