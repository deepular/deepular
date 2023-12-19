import { TestBed } from '@angular/core/testing';

import { AppModule, ServiceContainer } from '../lib/injector';

export function setupTestingModule(module: AppModule): ServiceContainer {
  const serviceContainer = new ServiceContainer(module);
  serviceContainer.process();
  TestBed.configureTestingModule({
    imports: [module],
  });
  return serviceContainer;
}
