/// <reference types="vite/client" />
import 'zone.js/node';
import { join } from 'node:path';
import { startServer } from '@ngkit/server';
import { ApplicationServer } from '@deepkit/framework';

import { AppController } from './app.controller';
import { AppComponent } from './app.component';

const publicDir = join(process.cwd(), 'dist', 'public');
const documentPath = join(publicDir, 'index.html');

import.meta.hot?.accept();

await startServer(AppComponent, {
  controllers: [AppController],
  documentPath,
  publicDir,
});
