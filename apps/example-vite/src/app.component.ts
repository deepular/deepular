import { Component, Inject } from '@angular/core';
import { SignalController } from '@ngkit/core';

import type { AppController } from './app.controller';

@Component({
  selector: 'ngkit-app-root',
  standalone: true,
  template: `<div>Count: {{ count.value() }}</div>
    - <button (click)="count.refetch()">Update</button>`,
})
export class AppComponent {
  readonly count = this.app.count();

  constructor(
    readonly app: SignalController<AppController>,
  ) {}
}
