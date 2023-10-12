/// <reference types="vite/client" />
import 'zone.js/node';
import { join } from 'node:path';
import { startServer } from '@ngkit/server';

import { AppController } from './app.controller';
import { AppComponent } from './app.component';

const publicDir = join(__dirname, 'public');
const documentPath = join(__dirname, '..', 'index.html');

import.meta.hot?.accept();

await startServer(AppComponent, {
  controllers: [AppController],
  documentPath,
  publicDir,
});
