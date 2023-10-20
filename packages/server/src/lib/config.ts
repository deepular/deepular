import { ApplicationConfig } from '@angular/core';

export class ServerConfig {
  readonly rootComponent: any; // ClassType
  readonly documentPath?: string;
  readonly document?: string;
  readonly app?: NgApplicationConfig;
}
