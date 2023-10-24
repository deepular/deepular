import { AppModule, setupModuleRootInjector } from '@ngkit/core';
import { TestBed } from '@angular/core/testing';

export function setupModule(module: AppModule): TestBed {
  setupModuleRootInjector(module);
  return TestBed.configureTestingModule({
    imports: [module],
  });
}
