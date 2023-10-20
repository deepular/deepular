import { Component } from '@angular/core';

import { FlowerService } from './flower.service';

@Component({
  selector: 'ngkit-flower',
  template: '<b>{{ flower.get() }}</b>',
})
export class FlowerComponent {
  constructor(private readonly flower: FlowerService) {}
}
