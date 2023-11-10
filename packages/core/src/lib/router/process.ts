import {
  ActivatedRouteSnapshot,
  CanActivateChildFn as NgCanActivateChildFn,
  CanActivateFn as NgCanActivateFn,
  CanDeactivateFn as NgCanDeactivateFn,
  provideRouter as provideNgRouter,
  Route as NgRoute,
  RouterFeatures,
  RouterStateSnapshot,
  Routes as NgRoutes,
  UrlSegment,
} from '@angular/router';
import { EnvironmentProviders } from '@angular/core';
import { ClassType, isClass } from '@deepkit/core';
import {
  reflect,
  TypeFunction,
  isSameType,
  Type,
} from '@deepkit/type';

import { AppModule, createModule, createStandaloneComponentModule, ServiceContainer } from '../injector';
import {
  activatedRouteSnapshotType,
  NgCanMatchFn,
  ResolveFn,
  Route, routerStateSnapshotType, routerStateTransitionSnapshotType,
  Routes,
  routeType,
  urlSegmentsType,
} from './types';
import { maybeUnwrapDefaultExport } from './utils';

export interface ParentRouteData {
  readonly module: RouteModule;
  readonly route: Route;
}

export class RouteModule extends createModule({}) {
  readonly children = new Set<RouteModule>();

  constructor(
    readonly current: Route,
    parent?: ParentRouteData,
  ) {
    super();
    this.name = current.path || 'index';
    if (current.providers) {
      this.addProvider(...current.providers);
    }
    if (current.imports) {
      this.addImport(...current.imports);
    }
    if (parent) {
      this.setParent(parent.module);
      parent.module.addChild(this);
    }
  }

  addChild(module: RouteModule): void {
    this.children.add(module);
  }
}

function processRouteGuards(module: RouteModule, route: Route) {
  if (route.canActivate) {
    route.canActivate = route.canActivate.map(canActivate => {
      if (isClass(canActivate)) {
        if (!module.isProvided(canActivate)) {
          module.addProvider(canActivate);
        }
        return (...args: Parameters<NgCanActivateFn>) => {
          const guard = module.injector!.get(canActivate);
          return guard.canActivate(...args);
        };
      }

      return (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => resolveRouteFunction(module, canActivate, [
        [activatedRouteSnapshotType, childRoute],
        [routerStateSnapshotType, state],
      ]);
    });
  }

  if (route.canActivateChild) {
    route.canActivateChild = route.canActivateChild.map(canActivateChild => {
      if (isClass(canActivateChild)) {
        if (!module.isProvided(canActivateChild)) {
          module.addProvider(canActivateChild);
        }
        return (...args: Parameters<NgCanActivateChildFn>) => {
          const guard = module.injector!.get(canActivateChild);
          return guard.canActivateChild(...args);
        };
      }

      return (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => resolveRouteFunction(module, canActivateChild, [
        [activatedRouteSnapshotType, childRoute],
        [routerStateSnapshotType, state],
      ]);
    });
  }

  if (route.canDeactivate) {
    route.canDeactivate = route.canDeactivate.map(canDeactivate => {
      if (isClass(canDeactivate)) {
        if (!module.isProvided(canDeactivate)) {
          module.addProvider(canDeactivate);
        }
        return (component: unknown, currentRoute: ActivatedRouteSnapshot, current: RouterStateSnapshot, next: RouterStateSnapshot) => {
          const guard = module.injector!.get(canDeactivate);
          return guard.canDeactivate(component, currentRoute, { current, next });
        };
      }

      return (component: unknown, currentRoute: ActivatedRouteSnapshot, current: RouterStateSnapshot, next: RouterStateSnapshot) => resolveRouteFunction(module, canDeactivate, [
        [reflect(component), component],
        [activatedRouteSnapshotType, currentRoute],
        [routerStateTransitionSnapshotType, { current, next }],
      ]);
    });
  }

  if (route.canMatch) {
    route.canMatch = route.canMatch.map(canMatch => {
      if (isClass(canMatch)) {
        if (!module.isProvided(canMatch)) {
          module.addProvider(canMatch);
        }
        return (...args: Parameters<NgCanMatchFn>) => {
          const guard = module.injector!.get(canMatch);
          return guard.canMatch(...args);
        };
      }

      return (route: Route, segments: UrlSegment[]) => resolveRouteFunction(module, canMatch, [
        [routeType, route],
        [urlSegmentsType, segments],
      ]);
    });
  }
}

function processRouteResolvers(module: RouteModule, route: Route) {
  if (route.resolve) {
    for (const [key, resolve] of Object.entries(route.resolve)) {
      const ngResolve = route.resolve as Record<string, ResolveFn<unknown>>;
      if (isClass(resolve)) {
        module.addProvider(resolve);

        ngResolve[key] = (
          route: ActivatedRouteSnapshot,
          state: RouterStateSnapshot,
        ) => {
          const resolver = module.injector!.get(resolve);
          return resolver.resolve(route, state);
        };
      } else {
        ngResolve[key] = (
          route: ActivatedRouteSnapshot,
          state: RouterStateSnapshot,
        ) => resolveRouteFunction(module, resolve, [
          [activatedRouteSnapshotType, route],
          [routerStateSnapshotType, state],
        ]);
      }
    }
  }
}

function processRouteChildren(module: RouteModule, route: Route) {
  const process = (routes: Routes) => {
    for (const nextRoute of routes) {
      processRoute(nextRoute as Route, { route, module });
    }
  }

  if (route.loadChildren) {
    const loadChildren = route.loadChildren;
    route.loadChildren = async () => {
      const routes = maybeUnwrapDefaultExport(await loadChildren());
      process(routes);
      return routes;
    };
  } else if (route.children) {
    process(route.children);
  }
}

function processComponent(serviceContainer: ServiceContainer, route: Route) {
  const process = (component: ClassType) => {
    const componentModule = createStandaloneComponentModule(component);
    serviceContainer.appModule.addImport(componentModule);
    serviceContainer.process();
  }

  if (route.loadComponent) {
    const loadComponent = route.loadComponent;
    route.loadComponent = async () => {
      const component = maybeUnwrapDefaultExport(await loadComponent());
      process(component);
      return component;
    };
  } else if (route.component) {
    process(route.component);
  }
}

function resolveRouteFunction<Fn extends (...args: any) => any>(
  module: AppModule,
  fn: Fn,
  deps: readonly [type: Type, value: unknown][] = [],
): ReturnType<Fn> {
  const fnType = reflect(fn) as TypeFunction;
  const args = fnType.parameters.map(parameter => {
    const dep = deps.find(dep => isSameType(parameter.type, dep[0]));
    return dep?.[1] || module.injector!.get(parameter.type);
  });
  return fn(...args);
}

// TODO: Create and return a new route object instead of overwriting it
export function processRoute(route: Route, parent?: ParentRouteData): NgRoute {
  const module = new RouteModule(route, parent);
  const serviceContainer = new ServiceContainer(module);

  processRouteChildren(module, route);

  processRouteGuards(module, route);

  processRouteResolvers(module, route);

  processComponent(serviceContainer, route);

  return route as NgRoute;
}

export function processRoutes(routes: Routes): void {
  for (const route of routes) {
    processRoute(route);
  }
}

export function provideRouter(
  routes: Routes,
  ...features: RouterFeatures[]
): EnvironmentProviders {
  processRoutes(routes);
  return provideNgRouter(routes as NgRoutes, ...features);
}
