import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SignalController } from '@ngkit/core';

import type { AppController } from './app.controller';
import { FlowerModule } from './flower.module';

@Component({
  selector: 'ngkit-app-root',
  standalone: true,
  // FIXME: add type to declaration
  // @ts-ignore
  imports: [new FlowerModule()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div>Value: {{ count.value() }}</div>
    <div>Loading: {{ count.loading() }}</div>
    <button (click)="count.refetch()">Refetch</button
    ><ngkit-flower></ngkit-flower>`,
})
export class AppComponent {
  readonly count = this.app.count();

  constructor(readonly app: SignalController<AppController>) {}
}
