import { startServer } from '@ngkit/server';
import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';

import { AppController } from './app.controller';
import { AppComponent } from './app.component';

const app = new App({
  imports: [new FrameworkModule],
  controllers: [AppController],
});

void startServer(AppComponent, app);
