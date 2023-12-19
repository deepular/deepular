import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@deepular/core';

export class ServerConfig {
  readonly rootComponent: any; // ClassType
  readonly documentPath?: string;
  readonly document?: string;
  readonly app?: ApplicationConfig;
  readonly router: any; // ReturnType<typeof provideRouter>;
}
