import { Component } from '@angular/core';
import { SignalController } from '@deepular/core';

import type { SignalControllerController } from './signal-controller.controller';

@Component({
  selector: 'signal-controller',
  standalone: true,
  template: `
    <p id="value">Value: {{ number.value() }}</p>
    <button id="refetch" (click)="number.refetch()">Refetch</button>
  `,
})
export class SignalControllerComponent {
  readonly number = this.ctrl.getNumber();

  constructor(protected readonly ctrl: SignalController<SignalControllerController>) {}
}
