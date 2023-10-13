import { Component } from '@angular/core';
import { SignalController } from '@ngkit/core';

import type { AppController } from './app.controller';

@Component({
  selector: 'ngkit-app-root',
  standalone: true,
  template: `<div>Value: {{ count.value() }}</div>
    <div>Loading: {{ count.loading() }}</div>
    <button (click)="count.refetch()">Refetch</button>`,
})
export class AppComponent {
  readonly count = this.app.count();

  constructor(readonly app: SignalController<AppController>) {
    console.log({
      loading: this.count.loading(),
      value: this.count.value(),
    });
  }
}
