import { describe } from 'vitest';
import { Component } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  RouterOutlet,
  RouterStateSnapshot,
  UrlSegment,
} from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { ControllersModule, createModule, ServiceContainer } from '@ngkit/core';
import { assert, Type } from '@deepkit/type';

import { NgKitRoute, processRoutes } from './process';
import {
  CanActivate,
  CanActivateChild,
  CanDeactivate,
  CanMatch,
  Resolve,
  Route,
  RouterStateTransition,
} from './types';

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
  template: `Test`,
})
class TestComponent {}

describe('route', () => {
  describe('canActivate', () => {
    class TestGuard implements CanActivate {
      canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        assert<ActivatedRouteSnapshot>(route);
        assert<RouterStateSnapshot>(state);
        return true;
      }
    }

    test('class', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        canActivate: [TestGuard],
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });

    test('callback', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        providers: [TestGuard],
        canActivate: [
          (
            guard: TestGuard,
            route: ActivatedRouteSnapshot,
            state: RouterStateSnapshot,
          ) => guard.canActivate(route, state),
        ],
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });
  });

  describe('canActivateChild', () => {
    class TestGuard implements CanActivateChild {
      canActivateChild(
        childRoute: ActivatedRouteSnapshot,
        state: RouterStateSnapshot,
      ) {
        assert<ActivatedRouteSnapshot>(childRoute);
        assert<RouterStateSnapshot>(state);
        return true;
      }
    }

    test('class', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        canActivateChild: [TestGuard],
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });

    test('callback', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        providers: [TestGuard],
        canActivateChild: [
          (
            guard: TestGuard,
            childRoute: ActivatedRouteSnapshot,
            state: RouterStateSnapshot,
          ) => guard.canActivateChild(childRoute, state),
        ],
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });
  });

  describe('canDeactivate', () => {
    class TestGuard implements CanDeactivate<TestComponent> {
      canDeactivate(
        component: TestComponent,
        currentRoute: ActivatedRouteSnapshot,
        stateTransition: RouterStateTransition,
      ) {
        assert<TestComponent>(component);
        assert<ActivatedRouteSnapshot>(currentRoute);
        assert<RouterStateTransition>(stateTransition);
        return true;
      }
    }

    test('class', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        canDeactivate: [TestGuard],
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });

    test('callback', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        providers: [TestGuard],
        canDeactivate: [
          (
            guard: TestGuard,
            component: TestComponent,
            currentRoute: ActivatedRouteSnapshot,
            stateTransition: RouterStateTransition,
          ) => guard.canDeactivate(component, currentRoute, stateTransition),
        ],
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });
  });

  describe('canMatch', () => {
    class TestGuard implements CanMatch {
      canMatch(route: Route, segments: readonly UrlSegment[]) {
        assert<Route>(route);
        assert<readonly UrlSegment[]>(segments);
        return true;
      }
    }

    test('class', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        canMatch: [TestGuard],
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });

    test('callback', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        providers: [TestGuard],
        canMatch: [
          (guard: TestGuard, route: Route, segments: readonly UrlSegment[]) =>
            guard.canMatch(route, segments),
        ],
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });
  });

  describe('resolve', () => {
    class TestResolver implements Resolve<null> {
      resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        assert<ActivatedRouteSnapshot>(route);
        assert<RouterStateSnapshot>(state);
        return null;
      }
    }

    test('class', async () => {
      const route = NgKitRoute.process({
        path: '',
        component: TestComponent,
        resolve: {
          data: TestResolver,
        },
      });

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });

    test('callback', async () => {
      const route = NgKitRoute.process({
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

      const { navigate } = await render(RootComponent, {
        routes: [route],
      });

      await navigate('/');
    });
  });

  test('loadChildren', async () => {
    const route = NgKitRoute.process({
      path: '',
      loadChildren: async () => [
        {
          path: '',
          component: TestComponent,
        },
      ],
    });

    const { navigate } = await render(RootComponent, {
      routes: [route],
    });

    await navigate('/');

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('loadComponent', async () => {
    const route = NgKitRoute.process({
      path: '',
      loadComponent: async () => TestComponent,
    });

    const { navigate } = await render(RootComponent, {
      routes: [route],
    });

    await navigate('/');

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('loadComponent + resolve', async () => {
    @Component({
      selector: 'test',
      standalone: true,
      template: `<span data-testid="data">{{ route.snapshot.data['data'] }}</span>`,
    })
    class TestComponent {
      constructor(readonly route: ActivatedRoute) {}
    }

    const route = NgKitRoute.process({
      path: '',
      loadComponent: async () => TestComponent,
      resolve: { data: () => 'test' },
    });

    const { navigate } = await render(RootComponent, {
      routes: [route],
    });

    await navigate('/');

    expect(screen.getByTestId('data')).toHaveTextContent('test');
  });
});
