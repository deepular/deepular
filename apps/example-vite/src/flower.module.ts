import { createModule } from '@ngkit/injector';

import { FlowerComponent } from './flower.component';
import { FlowerService } from './flower.service';
import { NgModule } from '@angular/core';

// export class FlowerModule extends createModule({
//   declarations: [FlowerComponent],
//   providers: [FlowerService],
//   exports: [FlowerComponent],
// }) {}

@NgModule({
  declarations: [FlowerComponent],
  providers: [FlowerService],
  exports: [FlowerComponent],
})
export class FlowerModule {}
