import {
  Route as NgRoute,
  CanActivateFn as NgCanActivateFn,
  ResolveFn as NgResolveFn,
  CanActivateChildFn as NgCanActivateChildFn,
  CanDeactivateFn as NgCanDeactivateFn,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import { ClassType } from '@deepkit/core';

import { AppModule, ProviderWithScope } from '../injector';
import { Observable } from 'rxjs';

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

export type CanDeactivateFn<T> = (
  ...args: any[]
) => ReturnType<NgCanDeactivateFn<T>>;

export interface CanDeactivate<T> {
  canDeactivate: NgCanDeactivateFn<T>;
}

export type CanDeactivateGuard<T> =
  | ClassType<CanDeactivate<T>>
  | CanDeactivateFn<T>;

export type CanMatchFn = (
  ...args: any[]
) => (
  route: Route,
  segments: UrlSegment[],
) =>
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree;

export interface CanMatch {
  canMatch: CanMatchFn;
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

// should be injectable
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
  > {
  canActivate?: readonly CanActivateGuard[];
  canMatch?: readonly CanMatchGuard[];
  canActivateChild?: readonly CanActivateChildGuard[];
  canDeactivate?: readonly CanDeactivateGuard<unknown>[];
  resolve?: ResolveData;
  providers?: readonly ProviderWithScope[];
  imports?: readonly AppModule[];
}

export type Routes = readonly Route[];
