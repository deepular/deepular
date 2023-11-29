import {
  CanActivateChildFn as NgCanActivateChildFn,
  CanActivateFn as NgCanActivateFn,
  RouterFeatures,
  Routes as NgRoutes,
  Route as NgRoute,
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  provideRouter as provideNgRouter,
} from '@angular/router';
import { EnvironmentProviders } from '@angular/core';
import { ClassType, isClass } from '@deepkit/core';
import { TypeFunction, Type, reflect, isSameType } from '@deepkit/type';
import { Writable } from 'type-fest';

import {
  AppModule,
  createModule,
  createStandaloneComponentModule,
  provideNgDependency,
  ServiceContainer,
} from '../injector';
import {
  NgCanMatchFn,
  ResolveFn,
  Route,
  Routes,
  activatedRouteSnapshotType,
  routeType,
  urlSegmentsType,
  routerStateSnapshotType,
  routerStateTransitionType,
} from './types';
import { maybeUnwrapDefaultExport } from './utils';
import { ControllersModule } from '../controllers.module';

export class RouteModule extends createModule({
  providers: [
    provideNgDependency(ActivatedRoute),
    provideNgDependency(Router),
  ],
}) {
  componentModule?: AppModule;
  readonly controllersModule?: ControllersModule;

  constructor(
    readonly current: Route,
    controllersModule?: ControllersModule,
    parent?: NgKitRoute,
  ) {
    super();
    this.name = current.path || 'index';
    if (controllersModule) {
      this.controllersModule = controllersModule.create();
      this.addImport(this.controllersModule);
    }
    if (current.providers) {
      this.addProvider(...current.providers);
    }
    if (current.imports) {
      this.addImport(...current.imports);
    }
    if (parent) {
      this.name = `${parent.module.name}-${this.name}`;
      this.setParent(parent.module);
    }
  }

  // so that ControllersModule can detect which controllers are used
  processCallback(cb: (...args: any[]) => any) {
    this.controllersModule?.processProvider(undefined, undefined, {
      provide: cb,
      useFactory: cb,
    });
  }

  processComponent(component: ClassType): void {
    if (this.componentModule) {
      throw new Error('Standalone component module already created');
    }

    this.componentModule = createStandaloneComponentModule(component);

    if (!this.injector) {
      this.addImport(this.componentModule);
    } else {
      if (this.controllersModule) {
        this.componentModule.addImport(this.controllersModule.create());
      }
      this.componentModule.addProvider(...this.getProviders());
      // FIXME: ServiceNotFoundError: Service 'ServerControllerResolverComponent' in RouteModule not found. Make sure it is provided.
      // this.componentModule.setParent(this);
      new ServiceContainer(this.componentModule).process();
    }
  }
}

export class NgKitRoute {
  readonly module: RouteModule;
  readonly serviceContainer: ServiceContainer;
  public componentServiceContainer?: ServiceContainer;

  constructor(
    private readonly route: Writable<Route>,
    private readonly controllersModule?: ControllersModule,
    parent?: NgKitRoute,
  ) {
    this.module = new RouteModule(route, controllersModule, parent);
    this.serviceContainer = new ServiceContainer(this.module);
  }

  static process(
    route: Route,
    controllersModule?: ControllersModule,
    parent?: NgKitRoute,
  ) {
    return new NgKitRoute(route, controllersModule, parent).process();
  }

  private processComponent() {
    if (this.route.loadComponent) {
      const loadComponent = this.route.loadComponent;
      this.route.loadComponent = async () => {
        const component = maybeUnwrapDefaultExport(await loadComponent());
        this.module.processComponent(component);
        return component;
      };
    } else if (this.route.component) {
      this.module.processComponent(this.route.component);
    }
  }

  private processChildren() {
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

  private resolveCallback<Fn extends (...args: any) => any>(
    callback: Fn,
    dependencies: readonly [type: Type, value: unknown][] = [],
  ): ReturnType<Fn> {
    const cbType = reflect(callback) as TypeFunction;
    const args = cbType.parameters.map(parameter => {
      const dependency = dependencies.find(dependency => isSameType(parameter.type, dependency[0]));
      return dependency?.[1] || this.module.injector!.get(parameter.type);
    });
    return callback(...args);
  }

  private processGuards() {
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

        this.module.processCallback(canActivate);

        return (
          childRoute: ActivatedRouteSnapshot,
          state: RouterStateSnapshot,
        ) =>
          this.resolveCallback(canActivate, [
            [activatedRouteSnapshotType, childRoute],
            [routerStateSnapshotType, state],
          ]);
      });
    }

    if (this.route.canActivateChild) {
      this.route.canActivateChild = this.route.canActivateChild.map(
        canActivateChild => {
          if (isClass(canActivateChild)) {
            if (!this.module.isProvided(canActivateChild)) {
              this.module.addProvider(canActivateChild);
            }
            return (...args: Parameters<NgCanActivateChildFn>) => {
              const guard = this.module.injector!.get(canActivateChild);
              return guard.canActivateChild(...args);
            };
          }

          this.module.processCallback(canActivateChild);

          return (
            childRoute: ActivatedRouteSnapshot,
            state: RouterStateSnapshot,
          ) =>
            this.resolveCallback(canActivateChild, [
              [activatedRouteSnapshotType, childRoute],
              [routerStateSnapshotType, state],
            ]);
        },
      );
    }

    if (this.route.canDeactivate) {
      this.route.canDeactivate = this.route.canDeactivate.map(canDeactivate => {
        if (isClass(canDeactivate)) {
          if (!this.module.isProvided(canDeactivate)) {
            this.module.addProvider(canDeactivate);
          }
          return (
            component: unknown,
            currentRoute: ActivatedRouteSnapshot,
            current: RouterStateSnapshot,
            next: RouterStateSnapshot,
          ) => {
            const guard = this.module.injector!.get(canDeactivate);
            return guard.canDeactivate(component, currentRoute, {
              current,
              next,
            });
          };
        }

        this.module.processCallback(canDeactivate);

        return (
          component: unknown,
          currentRoute: ActivatedRouteSnapshot,
          current: RouterStateSnapshot,
          next: RouterStateSnapshot,
        ) =>
          this.resolveCallback(canDeactivate, [
            [reflect(component), component],
            [activatedRouteSnapshotType, currentRoute],
            [routerStateTransitionType, { current, next }],
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

        this.module.processCallback(canMatch);

        return (route: Route, segments: UrlSegment[]) =>
          this.resolveCallback(canMatch, [
            [routeType, route],
            [urlSegmentsType, segments],
          ]);
      });
    }
  }

  private processResolvers() {
    if (this.route.resolve) {
      for (const [key, resolve] of Object.entries(this.route.resolve)) {
        const ngResolve = this.route.resolve as Record<
          string,
          ResolveFn<unknown>
        >;
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
          this.module.processCallback(resolve);

          ngResolve[key] = (
            route: ActivatedRouteSnapshot,
            state: RouterStateSnapshot,
          ) =>
            this.resolveCallback(resolve, [
              [activatedRouteSnapshotType, route],
              [routerStateSnapshotType, state],
            ]);
        }
      }
    }
  }

  process(): NgRoute {
    this.processChildren();
    this.processGuards();
    this.processResolvers();
    this.processComponent();
    this.serviceContainer.process();

    return this.route as NgRoute;
  }
}

export function processRoutes(
  routes: Routes,
  controllersModule?: ControllersModule,
  parent?: NgKitRoute,
): void {
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
  };
}
