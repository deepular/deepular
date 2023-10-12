import { createModule } from '@ngkit/core';

import { AppService } from './app.service';

export class AppModule extends createModule({
  providers: [AppService],
  exports: [AppService],
}) {}
