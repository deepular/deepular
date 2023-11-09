import {
  Route as NgRoute,
  CanActivateFn as NgCanActivateFn,
  ResolveFn as NgResolveFn,
  CanMatchFn as NgCanMatchFn,
  UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot,
} from '@angular/router';
import { AbstractClassType, ClassType } from '@deepkit/core';

export type CanActivateFn =  (...args: any[]) => ReturnType<NgCanActivateFn>;

export type CanMatchFn =  (...args: any[]) => ReturnType<NgCanMatchFn>;

export type ResolveFn<T> = (...args: any[]) => ReturnType<NgResolveFn<T>>;

export type ResolveData = {
  [key: string | symbol]: AbstractClassType<Resolver<unknown>> | ((...args: readonly unknown[]) => unknown);
};

// should be injectable
export interface Route extends Omit<NgRoute, 'canActivate' | 'canMatch' | 'canActivateChild' | 'canDeactivate' | 'canLoad' | 'resolve'> {
  canActivate?: readonly ClassType[];
  canMatch?: readonly ClassType[];
  canActivateChild?: readonly ClassType[];
  canDeactivate?: readonly ClassType[];
  canLoad?: readonly ClassType[];
  resolve?: ResolveData;
}

export type Routes = readonly Route[];

// should be injectable
export type UrlSegments = readonly UrlSegment[];

export interface Resolver<T> {
  resolve: NgResolveFn<T>;
}
