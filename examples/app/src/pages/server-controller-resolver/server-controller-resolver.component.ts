import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'server-controller-resolver',
  standalone: true,
  template: `Hello {{ route.snapshot.data['data'] }}`,
})
export class ServerControllerResolverComponent {
  constructor(protected readonly route: ActivatedRoute) {}
}
