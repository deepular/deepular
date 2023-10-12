import 'zone.js';
import { bootstrapClientApplication } from '@ngkit/client';

import { AppComponent } from './app/app.component';

await bootstrapClientApplication(AppComponent, ['AppController']);
