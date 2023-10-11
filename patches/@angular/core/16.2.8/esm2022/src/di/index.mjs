/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @module
 * @description
 * The `di` module provides dependency injection container services.
 */
export * from './metadata';
export { assertInInjectionContext, runInInjectionContext } from './contextual';
export { InjectFlags } from './interface/injector';
export { ɵɵdefineInjectable, defineInjectable, ɵɵdefineInjector } from './interface/defs';
export { forwardRef, resolveForwardRef } from './forward_ref';
export { setInjectImplementation } from './inject_switch';
export { Injectable } from './injectable';
export { Injector } from './injector';
export { EnvironmentInjector } from './r3_injector';
export { importProvidersFrom, makeEnvironmentProviders } from './provider_collection';
export { ENVIRONMENT_INITIALIZER } from './initializer_token';
export { ɵɵinject, inject, ɵɵinvalidFactoryDep } from './injector_compatibility';
export { INJECTOR } from './injector_token';
export { InjectionToken } from './injection_token';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSDs7OztHQUlHO0FBRUgsY0FBYyxZQUFZLENBQUM7QUFDM0IsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHFCQUFxQixFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzdFLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQStCLE1BQU0sa0JBQWtCLENBQUM7QUFDdEgsT0FBTyxFQUFDLFVBQVUsRUFBRSxpQkFBaUIsRUFBZSxNQUFNLGVBQWUsQ0FBQztBQUMxRSxPQUFPLEVBQUMsVUFBVSxFQUEwQyxNQUFNLGNBQWMsQ0FBQztBQUNqRixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNsRCxPQUFPLEVBQUMsbUJBQW1CLEVBQXlCLHdCQUF3QixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDM0csT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFNUQsT0FBTyxFQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUUvRSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFMUMsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8qKlxuICogQG1vZHVsZVxuICogQGRlc2NyaXB0aW9uXG4gKiBUaGUgYGRpYCBtb2R1bGUgcHJvdmlkZXMgZGVwZW5kZW5jeSBpbmplY3Rpb24gY29udGFpbmVyIHNlcnZpY2VzLlxuICovXG5cbmV4cG9ydCAqIGZyb20gJy4vbWV0YWRhdGEnO1xuZXhwb3J0IHthc3NlcnRJbkluamVjdGlvbkNvbnRleHQsIHJ1bkluSW5qZWN0aW9uQ29udGV4dH0gZnJvbSAnLi9jb250ZXh0dWFsJztcbmV4cG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlL2luamVjdG9yJztcbmV4cG9ydCB7ybXJtWRlZmluZUluamVjdGFibGUsIGRlZmluZUluamVjdGFibGUsIMm1ybVkZWZpbmVJbmplY3RvciwgSW5qZWN0YWJsZVR5cGUsIEluamVjdG9yVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2UvZGVmcyc7XG5leHBvcnQge2ZvcndhcmRSZWYsIHJlc29sdmVGb3J3YXJkUmVmLCBGb3J3YXJkUmVmRm59IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuZXhwb3J0IHtJbmplY3RhYmxlLCBJbmplY3RhYmxlRGVjb3JhdG9yLCBJbmplY3RhYmxlUHJvdmlkZXJ9IGZyb20gJy4vaW5qZWN0YWJsZSc7XG5leHBvcnQge0luamVjdG9yfSBmcm9tICcuL2luamVjdG9yJztcbmV4cG9ydCB7RW52aXJvbm1lbnRJbmplY3Rvcn0gZnJvbSAnLi9yM19pbmplY3Rvcic7XG5leHBvcnQge2ltcG9ydFByb3ZpZGVyc0Zyb20sIEltcG9ydFByb3ZpZGVyc1NvdXJjZSwgbWFrZUVudmlyb25tZW50UHJvdmlkZXJzfSBmcm9tICcuL3Byb3ZpZGVyX2NvbGxlY3Rpb24nO1xuZXhwb3J0IHtFTlZJUk9OTUVOVF9JTklUSUFMSVpFUn0gZnJvbSAnLi9pbml0aWFsaXplcl90b2tlbic7XG5leHBvcnQge1Byb3ZpZGVyVG9rZW59IGZyb20gJy4vcHJvdmlkZXJfdG9rZW4nO1xuZXhwb3J0IHvJtcm1aW5qZWN0LCBpbmplY3QsIMm1ybVpbnZhbGlkRmFjdG9yeURlcH0gZnJvbSAnLi9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmV4cG9ydCB7SW5qZWN0T3B0aW9uc30gZnJvbSAnLi9pbnRlcmZhY2UvaW5qZWN0b3InO1xuZXhwb3J0IHtJTkpFQ1RPUn0gZnJvbSAnLi9pbmplY3Rvcl90b2tlbic7XG5leHBvcnQge0NsYXNzUHJvdmlkZXIsIE1vZHVsZVdpdGhQcm92aWRlcnMsIENsYXNzU2Fuc1Byb3ZpZGVyLCBJbXBvcnRlZE5nTW9kdWxlUHJvdmlkZXJzLCBDb25zdHJ1Y3RvclByb3ZpZGVyLCBFbnZpcm9ubWVudFByb3ZpZGVycywgQ29uc3RydWN0b3JTYW5zUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEV4aXN0aW5nU2Fuc1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIEZhY3RvcnlTYW5zUHJvdmlkZXIsIFByb3ZpZGVyLCBTdGF0aWNDbGFzc1Byb3ZpZGVyLCBTdGF0aWNDbGFzc1NhbnNQcm92aWRlciwgU3RhdGljUHJvdmlkZXIsIFR5cGVQcm92aWRlciwgVmFsdWVQcm92aWRlciwgVmFsdWVTYW5zUHJvdmlkZXJ9IGZyb20gJy4vaW50ZXJmYWNlL3Byb3ZpZGVyJztcbmV4cG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbiJdfQ==
