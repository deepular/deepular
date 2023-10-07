import { ApplicationConfig } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';

export const APP_CONFIG: ApplicationConfig = {
  providers: [provideClientHydration()],
};
