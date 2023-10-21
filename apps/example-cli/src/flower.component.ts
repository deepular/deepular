import { Component } from '@angular/core';
import { inject } from '@ngkit/core';

import { Flower } from './flower.service';

@Component({
  selector: 'ngkit-flower',
  template: '<b>{{ flower.name }}</b>',
})
export class FlowerComponent {
  readonly flower = inject<Flower>();
}
