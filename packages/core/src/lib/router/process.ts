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
import { ClassType, getClassName, isClass } from '@deepkit/core';
import {
  reflect,
  TypeFunction,
  isSameType,
  Type,
} from '@deepkit/type';

import {
  AppModule,
  createModule,
  createStandaloneComponentModule,
  ServiceContainer,
  setupRootComponent,
} from '../injector';
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
import { ControllersModule } from '../controllers.module';

export class RouteModule extends createModule({}) {
  readonly children = new Set<RouteModule>();

  constructor(
    readonly current: Route,
    controllersModule?: ControllersModule,
    parent?: NgKitRoute,
  ) {
    super();
    this.name = current.path || 'index';
    if (controllersModule) {
      // FIXME: doesn't work because module injector has already been built
      this.addImport(controllersModule);
    }
    if (current.providers) {
      this.addProvider(...current.providers);
    }
    if (current.imports) {
      this.addImport(...current.imports);
    }
    if (parent) {
      // this might not work because the parent has already been built
      this.setParent(parent.module);
      parent.module.addChild(this);
    }
  }

  addChild(module: RouteModule): void {
    this.children.add(module);
  }
}

export class NgKitRoute {
  readonly module: RouteModule;
  readonly serviceContainer: ServiceContainer;
  public componentServiceContainer?: ServiceContainer;

  constructor(
    private readonly route: Route,
    private readonly controllersModule?: ControllersModule,
    parent?: NgKitRoute,
  ) {
    this.module = new RouteModule(route, controllersModule, parent);
    this.serviceContainer = new ServiceContainer(this.module);
  }

  static process(route: Route, controllersModule?: ControllersModule, parent?: NgKitRoute) {
    return new NgKitRoute(route, controllersModule, parent).process();
  }

  private processComponent() {
    if (this.route.loadComponent) {
      const loadComponent = this.route.loadComponent;
      this.route.loadComponent = async () => {
        const component = maybeUnwrapDefaultExport(await loadComponent());
        const componentModule = createStandaloneComponentModule(component);
        this.componentServiceContainer = new ServiceContainer(componentModule);
        // FIXME: doesn't work because module injector has already been built
        componentModule.setParent(this.module);
        this.componentServiceContainer.process();
        return component;
      };
    } else if (this.route.component) {
      const componentModule = createStandaloneComponentModule(this.route.component);
      this.module.addImport(componentModule);
    }
  }

  private processRouteChildren() {
    if (this.route.loadChildren) {
      const loadChildren = this.route.loadChildren;
      this.route.loadChildren = async () => {
        const routes = maybeUnwrapDefaultExport(await loadChildren());
        processRoutes(routes, this.controllersModule, this);
        return routes;
      };
    } else if (this.route.children) {
      processRoutes(this.route.children, this.controllersModule, this);
    }
  }

  private resolveRouteFunction<Fn extends (...args: any) => any>(
    fn: Fn,
    deps: readonly [type: Type, value: unknown][] = [],
  ): ReturnType<Fn> {
    const fnType = reflect(fn) as TypeFunction;
    const args = fnType.parameters.map(parameter => {
      const dep = deps.find(dep => isSameType(parameter.type, dep[0]));
      return dep?.[1] || this.module.injector!.get(parameter.type);
    });
    return fn(...args);
  }

  private processRouteGuards() {
    if (this.route.canActivate) {
      this.route.canActivate = this.route.canActivate.map(canActivate => {
        if (isClass(canActivate)) {
          if (!this.module.isProvided(canActivate)) {
            this.module.addProvider(canActivate);
          }
          return (...args: Parameters<NgCanActivateFn>) => {
            const guard = this.module.injector!.get(canActivate);
            return guard.canActivate(...args);
          };
        }

        return (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => this.resolveRouteFunction(canActivate, [
          [activatedRouteSnapshotType, childRoute],
          [routerStateSnapshotType, state],
        ]);
      });
    }

    if (this.route.canActivateChild) {
      this.route.canActivateChild = this.route.canActivateChild.map(canActivateChild => {
        if (isClass(canActivateChild)) {
          if (!this.module.isProvided(canActivateChild)) {
            this.module.addProvider(canActivateChild);
          }
          return (...args: Parameters<NgCanActivateChildFn>) => {
            const guard = this.module.injector!.get(canActivateChild);
            return guard.canActivateChild(...args);
          };
        }

        return (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => this.resolveRouteFunction(canActivateChild, [
          [activatedRouteSnapshotType, childRoute],
          [routerStateSnapshotType, state],
        ]);
      });
    }

    if (this.route.canDeactivate) {
      this.route.canDeactivate = this.route.canDeactivate.map(canDeactivate => {
        if (isClass(canDeactivate)) {
          if (!this.module.isProvided(canDeactivate)) {
            this.module.addProvider(canDeactivate);
          }
          return (component: unknown, currentRoute: ActivatedRouteSnapshot, current: RouterStateSnapshot, next: RouterStateSnapshot) => {
            const guard = this.module.injector!.get(canDeactivate);
            return guard.canDeactivate(component, currentRoute, { current, next });
          };
        }

        return (component: unknown, currentRoute: ActivatedRouteSnapshot, current: RouterStateSnapshot, next: RouterStateSnapshot) => this.resolveRouteFunction(canDeactivate, [
          [reflect(component), component],
          [activatedRouteSnapshotType, currentRoute],
          [routerStateTransitionSnapshotType, { current, next }],
        ]);
      });
    }

    if (this.route.canMatch) {
      this.route.canMatch = this.route.canMatch.map(canMatch => {
        if (isClass(canMatch)) {
          if (!this.module.isProvided(canMatch)) {
            this.module.addProvider(canMatch);
          }
          return (...args: Parameters<NgCanMatchFn>) => {
            const guard = this.module.injector!.get(canMatch);
            return guard.canMatch(...args);
          };
        }

        return (route: Route, segments: UrlSegment[]) => this.resolveRouteFunction(canMatch, [
          [routeType, route],
          [urlSegmentsType, segments],
        ]);
      });
    }
  }

  private processRouteResolvers() {
    if (this.route.resolve) {
      for (const [key, resolve] of Object.entries(this.route.resolve)) {
        const ngResolve = this.route.resolve as Record<string, ResolveFn<unknown>>;
        if (isClass(resolve)) {
          this.module.addProvider(resolve);

          ngResolve[key] = (
            route: ActivatedRouteSnapshot,
            state: RouterStateSnapshot,
          ) => {
            const resolver = this.module.injector!.get(resolve);
            return resolver.resolve(route, state);
          };
        } else {
          ngResolve[key] = (
            route: ActivatedRouteSnapshot,
            state: RouterStateSnapshot,
          ) => this.resolveRouteFunction(resolve, [
            [activatedRouteSnapshotType, route],
            [routerStateSnapshotType, state],
          ]);
        }
      }
    }
  }

  process(): NgRoute {
    this.processRouteChildren();

    this.processRouteGuards();

    this.processRouteResolvers();

    this.processComponent();

    this.serviceContainer.process();

    return this.route as NgRoute;
  }
}

export function processRoutes(routes: Routes, controllersModule?: ControllersModule, parent?: NgKitRoute): void {
  for (const route of routes) {
    NgKitRoute.process(route, controllersModule, parent);
  }
}

export function provideRouter(
  routes: Routes,
  ...features: RouterFeatures[]
): (controllersModule: ControllersModule) => EnvironmentProviders {
  return (controllersModule: ControllersModule) => {
    processRoutes(routes, controllersModule);
    return provideNgRouter(routes as NgRoutes, ...features);
  }
}
