import { AppModule, ServiceContainer } from '@ngkit/core';
import { TestBed } from '@angular/core/testing';

export function setupModule(module: AppModule): ServiceContainer {
  const serviceContainer = new ServiceContainer(module);
  serviceContainer.process();
  TestBed.configureTestingModule({
    imports: [module],
  });
  return serviceContainer;
}
