import 'zone.js/node';
import { startServer } from '@ngkit/server';
import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';
import * as fs from 'node:fs';
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

const document = fs.readFileSync(join(publicDir, 'index.html'), 'utf8');

void startServer(AppComponent, document, app);
