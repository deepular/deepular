import { createModule } from '@ngkit/injector';
import { provide } from '@deepkit/injector';

import { FlowerComponent } from './flower.component';
import { Flower, FlowerService } from './flower.service';

export class FlowerConfig {
  readonly version: string;
}

export class FlowerModule extends createModule({
  config: FlowerConfig,
  declarations: [FlowerComponent],
  providers: [
    FlowerService,
    provide<Flower>({ useValue: { name: 'lily' } }),
  ],
  exports: [FlowerComponent],
}) {}
