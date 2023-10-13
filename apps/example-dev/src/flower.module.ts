import { createModule } from '@ngkit/injector';

import { FlowerComponent } from './flower.component';
import { FlowerService } from './flower.service';

export class FlowerModule extends createModule({
  declarations: [FlowerComponent],
  providers: [FlowerService],
  exports: [FlowerComponent],
}) {}
