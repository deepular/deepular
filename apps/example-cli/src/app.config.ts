import { ApplicationConfig } from '@angular/core';
import { provideRouter, ActivatedRouteSnapshot } from '@angular/router';
import { ServerController } from '@ngkit/core';

import { HomeController } from './pages/home/home.controller';
import { HomeResolver } from './pages/home/home.resolver';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([])],
};
