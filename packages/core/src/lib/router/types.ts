import {
  Route as NgRoute,
  CanActivateFn as NgCanActivateFn,
  ResolveFn as NgResolveFn,
  CanActivateChildFn as NgCanActivateChildFn,
  UrlSegment,
  UrlTree, DefaultExport, ActivatedRouteSnapshot, RouterStateSnapshot,
} from '@angular/router';
import { ClassType } from '@deepkit/core';
import { Observable } from 'rxjs';
import { TypeArray, TypeClass, TypeObjectLiteral, typeOf } from '@deepkit/type';

import { AppModule, ProviderWithScope } from '../injector';

export interface RouterStateTransitionSnapshot {
  readonly current: RouterStateSnapshot;
  readonly next: RouterStateSnapshot;
}

export type CanActivateFn = (...args: any[]) => ReturnType<NgCanActivateFn>;

export interface CanActivate {
  canActivate: NgCanActivateFn;
}

export type CanActivateGuard = ClassType<CanActivate> | CanActivateFn;

export type CanActivateChildFn = (
  ...args: any[]
) => ReturnType<NgCanActivateChildFn>;

export interface CanActivateChild {
  canActivateChild: NgCanActivateChildFn;
}

export type CanActivateChildGuard =
  | ClassType<CanActivateChild>
  | CanActivateChildFn;

export type NgCanDeactivateFn<T> = (component: T, currentRoute: ActivatedRouteSnapshot, stateTransition: RouterStateTransitionSnapshot) => Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;

export type CanDeactivateFn<T> = (
  ...args: any[]
) => ReturnType<NgCanDeactivateFn<T>>;

export interface CanDeactivate<T> {
  canDeactivate: NgCanDeactivateFn<T>;
}

export type CanDeactivateGuard<T> =
  | ClassType<CanDeactivate<T>>
  | CanDeactivateFn<T>;

export type NgCanMatchFn = (
  route: Route,
  segments: UrlSegment[],
) =>
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree;

export type CanMatchFn = (
  ...args: any[]
) => ReturnType<NgCanMatchFn>;

export interface CanMatch {
  canMatch: NgCanMatchFn;
}

export type CanMatchGuard = ClassType<CanMatch> | CanMatchFn;

export type ResolveFn<T> = (...args: any[]) => ReturnType<NgResolveFn<T>>;

export interface Resolve<T> {
  resolve: NgResolveFn<T>;
}

export type ResolveData = {
  [key: string | symbol]:
    | ClassType<Resolve<any>>
    | ((...args: readonly any[]) => any);
};

export type LoadChildrenCallback = () => Promise<DefaultExport<Routes> | Routes> | DefaultExport<Routes> | Routes;

export type LoadComponentCallback = () => Promise<DefaultExport<ClassType> | ClassType> | DefaultExport<ClassType> | ClassType;

export interface Route
  extends Omit<
    NgRoute,
    | 'canActivate'
    | 'canMatch'
    | 'canActivateChild'
    | 'canDeactivate'
    | 'canLoad'
    | 'resolve'
    | 'providers'
    | 'children'
    | 'loadChildren'
    | 'loadComponent'
  > {
  canActivate?: readonly CanActivateGuard[];
  canMatch?: readonly CanMatchGuard[];
  canActivateChild?: readonly CanActivateChildGuard[];
  canDeactivate?: readonly CanDeactivateGuard<any>[];
  resolve?: ResolveData;
  providers?: readonly ProviderWithScope[];
  imports?: readonly AppModule[];
  children?: Routes;
  loadChildren?: LoadChildrenCallback;
  loadComponent?: LoadComponentCallback;
}

export type Routes = readonly Route[];

export const routeType = typeOf<Route>() as TypeObjectLiteral;

export const urlSegmentsType = typeOf<UrlSegment[]>() as TypeArray;

export const activatedRouteSnapshotType = typeOf<ActivatedRouteSnapshot>() as TypeClass;

export const routerStateSnapshotType = typeOf<RouterStateSnapshot>() as TypeClass;

export const routerStateTransitionSnapshotType = typeOf<RouterStateTransitionSnapshot>() as TypeObjectLiteral;
