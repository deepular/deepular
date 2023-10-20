import { createModule } from '@ngkit/injector';

import { FlowerComponent } from './flower.component';
import { FlowerService } from './flower.service';

export class FlowerConfig {
  readonly version: string;
}

export class FlowerModule extends createModule({
  config: FlowerConfig,
  declarations: [FlowerComponent],
  providers: [FlowerService],
  exports: [FlowerComponent],
}) {
  override process() {
    console.log(this);
  }
}
