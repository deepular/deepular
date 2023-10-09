/// <reference types="vite/client" />
import 'zone.js/node';
import { startServer } from '@ngkit/server';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { AppComponent } from './app.component';

const publicDir = join(process.cwd(), 'dist', 'public');

const documentPath = join(publicDir, 'index.html');

console.log('Start server');

void startServer(AppComponent, {
  controllers: [AppController],
  documentPath,
  publicDir,
});
