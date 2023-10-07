import { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';

export const CORE_CONFIG: ApplicationConfig = {
  providers: [provideClientHydration()],
};
