import { Component, inject } from '@angular/core';
import { RemoteController } from '@ngkit/core';
import { ɵSERVER_CONTEXT as SERVER_CONTEXT } from '@angular/platform-server';

import { AppController, AppControllerApi } from '../shared';

@Component({
  selector: 'ngkit-app-root',
  standalone: true,
  template: `Count: {{ count() }}`,
})
export class AppComponent {
  readonly ctrl = AppControllerApi.inject();

  readonly count = (
    this.ctrl as unknown as RemoteController<AppController>
  ).count();
}
