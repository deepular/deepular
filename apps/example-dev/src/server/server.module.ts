import { createModule } from '@deepkit/app';

import { AppController } from './app.controller';

export class ServerModule extends createModule({
  controllers: [AppController],
  forRoot: true,
}) {}
