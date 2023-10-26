import { AppModule, ServiceContainer } from '@ngkit/core';
import { TestBed } from '@angular/core/testing';

export function setupModule(module: AppModule): TestBed {
  const serviceContainer = new ServiceContainer(module);
  serviceContainer.process();
  return TestBed.configureTestingModule({
    imports: [module],
  });
}
