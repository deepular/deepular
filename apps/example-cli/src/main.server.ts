/// <reference types="vite/client" />
import 'zone.js/node';
import { join } from 'node:path';
import { startServer } from '@ngkit/server';

import { AppComponent } from './app.component';
import { appConfig } from './app.config';
import { HomeController } from './pages/home/home.controller';
import { routes } from './routes';

const publicDir = join(__dirname, 'public');
const documentPath = join(__dirname, '..', 'index.html');

import.meta.hot?.accept();

void startServer(
  AppComponent,
  {
    controllers: [HomeController],
    documentPath,
    publicDir,
    routes,
  },
);
