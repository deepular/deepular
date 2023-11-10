import { describe, vitest } from 'vitest';
import { Component } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterOutlet,
  RouterStateSnapshot,
} from '@angular/router';
import { render } from '@testing-library/angular';

import { processRoute } from './process';
import { Resolve } from './types';
describe('processRoute', () => {
  test('resolve function works with angular dependencies', async () => {
    @Component({
      selector: 'root',
      standalone: true,
      imports: [RouterOutlet],
      template: `<router-outlet />`,
    })
    class RootComponent {}

    @Component({
      selector: 'test',
      standalone: true,
      template: ``,
    })
    class TestComponent {}

    // const resolve = vitest.fn();

    class TestResolver implements Resolve<null> {
      resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        expect(route.component).toBe(TestComponent);
        expect(state.url).toEqual('/');
        return null;
      }
      // resolve = resolve;
    }

    const ngRoute = processRoute({
      path: '',
      component: TestComponent,
      providers: [TestResolver],
      resolve: {
        data: (
          resolver: TestResolver,
          route: ActivatedRouteSnapshot,
          state: RouterStateSnapshot,
        ) => resolver.resolve(route, state),
      },
    });

    // resolve.mockReturnValue({});

    const { navigate } = await render(RootComponent, {
      routes: [ngRoute],
    });

    await navigate('/');

    // RangeError: Invalid string length
    // expect(resolve.mock.calls[0]).toMatchInlineSnapshot();
  });
});
