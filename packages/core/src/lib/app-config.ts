import {
  ApplicationConfig,
  mergeApplicationConfig as _mergeApplicationConfig,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';

export const CORE_CONFIG: ApplicationConfig = {
  providers: [provideClientHydration()],
};

export function mergeApplicationConfig(
  ...configs: (ApplicationConfig | null | undefined)[]
): ApplicationConfig {
  return _mergeApplicationConfig(
    ...configs.filter((config): config is ApplicationConfig => config != null),
  );
}
