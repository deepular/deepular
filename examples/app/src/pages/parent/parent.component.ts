import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'parent',
  standalone: true,
  imports: [RouterOutlet],
  template: `Parent <router-outlet />`,
})
export class ParentComponent {}
