/// <reference types="vite/client" />
import 'zone.js/node';
import { join } from 'node:path';
import { startServer } from '@ngkit/server';

import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { ServerControllerResolverController } from './pages/server-controller-resolver/server-controller-resolver.controller';
import { router } from './router';

const publicDir = join(__dirname, 'public');
const documentPath = join(__dirname, '..', 'index.html');

void startServer(
  AppComponent,
  {
    controllers: [ServerControllerResolverController],
    documentPath,
    publicDir,
    router,
  },
  appConfig,
);
