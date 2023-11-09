import { Component } from '@angular/core';
import { SignalController } from '@ngkit/core';

import type { HomeController } from './home.controller';

@Component({
  selector: 'home',
  standalone: true,
  template: ``,
})
export class HomeComponent {
  constructor(private readonly home: SignalController<HomeController>) {}
}
