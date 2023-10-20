/// <reference types="vite/client" />
import 'zone.js/node';
import { join } from 'node:path';
import { startServer } from '@ngkit/server';

import { AppController } from './app.controller';
import { AppComponent } from './app.component';
import { appConfig } from './app.config';

const publicDir = join(__dirname, 'public');
const documentPath = join(__dirname, '..', 'index.html');

import.meta.hot?.accept();

void startServer(
  AppComponent,
  {
    controllers: [AppController],
    documentPath,
    publicDir,
  },
  appConfig,
);
