import {
  setInjectImplementation,
  ɵsetCurrentInjector,
  Injector as NgInjector,
  Provider,
  StaticProvider,
  ɵɵdefineInjectable,
  ɵɵinject,
  INJECTOR,
  EnvironmentInjector,
  ProviderToken,
  InjectOptions,
  InjectFlags,
  InjectionToken,
} from '@angular/core';
import { Injector as DeepkitInjector } from '@deepkit/injector';

import { NG_PROV_DEF } from './defs';

export class NgKitInjector extends DeepkitInjector implements NgInjector {
  readonly instance: DeepkitInjector;

  static override create(options: {
    providers: Array<Provider | StaticProvider>;
    parent?: NgKitInjector;
    name?: string;
  }): NgKitInjector {}

  /** @nocollapse */
  static override [NG_PROV_DEF] = /** @pureOrBreakMyCode */ ɵɵdefineInjectable({
    token: NgInjector,
    providedIn: 'any',
    factory: () => ɵɵinject(INJECTOR),
  });

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__ = -1;

  override get<T>(
    token: ProviderToken<T>,
    notFoundValue: undefined,
    options: InjectOptions & { optional?: false },
  ): T;
  override get<T>(
    token: ProviderToken<T>,
    notFoundValue: null | undefined,
    options: InjectOptions,
  ): T | null;
  override get<T>(
    token: ProviderToken<T>,
    notFoundValue?: T,
    options?: InjectOptions | InjectFlags,
  ): T;
  override get<T>(
    token: ProviderToken<T>,
    notFoundValue?: T,
    flags?: InjectFlags,
  ): T;
  override get(token: any, notFoundValue?: any): any;
  override get(
    token,
    notFoundValue?,
    options?:
      | (InjectOptions & { optional?: false })
      | InjectOptions
      | InjectFlags,
  ): any {
    try {
      if (token instanceof InjectionToken) {
        super.get(token.toString(), notFoundValue, options);
      }
    } catch (err: unknown) {
      consoleo;
      if (notFoundValue) {
        return null;
      }
    }
  } // InjectorMarkers.Injector
}
