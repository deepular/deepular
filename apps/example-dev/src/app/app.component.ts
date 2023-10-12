import { Component } from '@angular/core';
import { SignalController } from '@ngkit/core';

import type { AppController } from '../server';
import { AppService } from './app.service';
import { AppModule } from './app.module';

@Component({
  selector: 'ngkit-app-root',
  standalone: true,
  template: `<div>Count: {{ count.value() }}</div>
    - <button (click)="count.refetch()">Update</button>`,
})
export class AppComponent {
  readonly count = this.appCtrl.count();

  constructor(
    readonly appCtrl: SignalController<AppController>,
    private readonly appSvc: AppService,
  ) {
    console.log(appSvc);
  }
}
