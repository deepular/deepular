import { Component } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';

@Component({
  selector: 'home',
  standalone: true,
  template: `Hello {{ route.data }}`,
})
export class HomeComponent {
  constructor(protected readonly route: ActivatedRouteSnapshot) {}
}
