import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';

import { ServeController } from './lib/cli';

await new App({
  // import: [new FrameworkModule],
  controllers: [ServeController],
}).run();
