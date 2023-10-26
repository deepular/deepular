import { FactoryProvider } from '@deepkit/injector';
import { inject, Type, ɵComponentDef, ɵNG_COMP_DEF } from '@angular/core';
import { AbstractClassType } from '@deepkit/core';

import { AppModule, createModule } from './module';
import { ServiceContainer } from './service-container';

export function getComponentDependencies<T>(
  componentDef: ɵComponentDef<T>,
): (Type<unknown> | AppModule)[] {
  return (
    ((typeof componentDef.dependencies === 'function'
      ? componentDef.dependencies()
      : componentDef.dependencies) as (Type<unknown> | AppModule)[]) || []
  );
}

export function getImportedModules<T>(
  componentDef: ɵComponentDef<T>,
): AppModule[] {
  const deps = getComponentDependencies(componentDef);
  return deps.filter((dep): dep is AppModule => dep instanceof AppModule);
}

export function createStandaloneComponentModule<T>(
  component: Type<T>,
): AppModule<any> {
  const componentDef: ɵComponentDef<T> | undefined =
    component[ɵNG_COMP_DEF as keyof typeof component];
  if (!componentDef?.standalone) {
    throw new Error(`${component.name} is not a standalone component`);
  }

  const imports = getImportedModules(componentDef);

  return new (class extends createModule<any>(
    {
      declarations: [component],
      exports: [component],
    },
    component.name,
  ) {
    override imports = imports;
  })();
}

export function setupRootComponent<T>(component: Type<T>): void {
  const rootModule = createStandaloneComponentModule(component);
  const serviceContainer = new ServiceContainer(rootModule);
  serviceContainer.process();
}

export function provideNg<T>(token: AbstractClassType<T>): FactoryProvider<T> {
  return {
    provide: token,
    useFactory: () => inject(token),
  };
}
