import {
  setInjectImplementation,
  ɵsetCurrentInjector,
  Injector,
  Provider,
  StaticProvider,
  ɵɵdefineInjectable,
  ɵɵinject,
  INJECTOR,
  EnvironmentInjector,
} from '@angular/core';

import { NG_PROV_DEF } from './defs';

export class DeepkitEnvironmentInjector extends EnvironmentInjector {}

export class DeepkitInjector extends Injector {
  static override create(options: {
    providers: Array<Provider | StaticProvider>;
    parent?: Injector;
    name?: string;
  }): DeepkitInjector {}

  /** @nocollapse */
  static override [NG_PROV_DEF] = /** @pureOrBreakMyCode */ ɵɵdefineInjectable({
    token: Injector,
    providedIn: 'any',
    factory: () => ɵɵinject(INJECTOR),
  });

  /**
   * @internal
   * @nocollapse
   */
  static __NG_ELEMENT_ID__ = -1; // InjectorMarkers.Injector
}

export function injector() {}

setInjectImplementation();

ɵsetCurrentInjector();
