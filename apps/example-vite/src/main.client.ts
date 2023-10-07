import 'zone.js';
import { bootstrapApplication } from '@ngkit/client';

import { AppComponent } from './app.component';
import { AppControllerApi } from './shared';

void bootstrapApplication(AppComponent, [AppControllerApi]);
