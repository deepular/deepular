import { Component, Inject } from '@angular/core';
import { ServerController } from '@ngkit/core';

import type { AppController } from './app.controller';

@Component({
  selector: 'ngkit-app-root',
  standalone: true,
  template: `<div>Count: {{ count() }}</div>`,
})
export class AppComponent {
  readonly count = this.app.count();

  constructor(
    @Inject('AppController') readonly app: ServerController<AppController>,
  ) {}
}