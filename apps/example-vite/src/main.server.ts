/// <reference types="vite/client" />
import 'zone.js/node';
import { startServer } from '@ngkit/server';
import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import { join } from 'node:path';

import { AppController } from './app.controller';
import { AppComponent } from './app.component';

const publicDir = join(
  // @ts-ignore
  import.meta.env.NX_WORKSPACE_ROOT,
  'dist',
  // @ts-ignore
  import.meta.env.NX_PROJECT_ROOT,
  'public',
);

const app = new App({
  imports: [
    new FrameworkModule({
      publicDir,
    }),
  ],
  controllers: [AppController],
});

const documentPath = join(publicDir, 'index.html');

void startServer(AppComponent, documentPath, app);
