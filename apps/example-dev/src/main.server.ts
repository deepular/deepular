/// <reference types="vite/client" />
import 'zone.js/node';
import { join } from 'node:path';
import { startServer } from '@ngkit/server';

import { AppComponent } from './app/app.component';
import { ServerModule } from './server/server.module';

const publicDir = join(process.cwd(), 'dist', 'public');
const documentPath = join(publicDir, 'index.html');

import.meta.hot?.accept();

await startServer(AppComponent, {
  imports: [new ServerModule()],
  documentPath,
  publicDir,
});
