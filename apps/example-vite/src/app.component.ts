import { Component, inject } from '@angular/core';
import { ServerController } from '@ngkit/core';
import { ɵSERVER_CONTEXT as SERVER_CONTEXT } from '@angular/platform-server';

import { AppControllerApi } from './shared';

@Component({
  selector: 'ngkit-app-root',
  standalone: true,
  template: `<div>Count: {{ count() }}</div>`,
})
export class AppComponent {
  readonly app = AppControllerApi.inject();
  readonly count = this.app.count();
}
