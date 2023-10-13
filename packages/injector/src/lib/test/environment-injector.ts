import {
  EnvironmentInjector,
  InjectFlags,
  InjectionToken,
  InjectOptions,
  ProviderToken,
  ɵsetCurrentInjector,
  ɵconvertToBitFlags,
  setInjectImplementation,
} from '@angular/core';
import { NG_ENV_ID } from './defs';

export class NgKitEnvironmentInjector extends EnvironmentInjector {
  override runInContext<ReturnT>(fn: () => ReturnT): ReturnT {
    const previousInjector = ɵsetCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(undefined);

    try {
      return fn();
    } finally {
      ɵsetCurrentInjector(previousInjector);
      setInjectImplementation(previousInjectImplementation);
    }
  }

  override get<T>(
    token: ProviderToken<T>,
    notFoundValue: any = THROW_IF_NOT_FOUND,
    flags: InjectFlags | InjectOptions = InjectFlags.Default,
  ): T {
    // eslint-disable-next-line no-prototype-builtins
    if (token.hasOwnProperty(NG_ENV_ID)) {
      return (token as any)[NG_ENV_ID](this);
    }

    flags = ɵconvertToBitFlags(flags) as InjectFlags;

    const previousInjector = ɵsetCurrentInjector(this);
    const previousInjectImplementation = setInjectImplementation(undefined);

    try {
      if (token instanceof InjectionToken) {
        super.get(token.toString(), notFoundValue, options);
      }
    } catch (err: unknown) {
      console.error(err);
      if (notFoundValue) {
        return null;
      }
    }
  } // InjectorMarkers.Injector
}

export function createEnvironmentInjector(
  providers: Array<Provider | EnvironmentProviders>,
  parent: EnvironmentInjector,
  debugName: string | null = null,
): EnvironmentInjector {
  const adapter = new EnvironmentNgModuleRefAdapter({
    providers,
    parent,
    debugName,
    runEnvironmentInitializers: true,
  });
  return adapter.injector;
}
