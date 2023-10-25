import { InjectorContext, InjectorModule } from '@deepkit/injector';
import { Type, ɵComponentDef, ɵNG_COMP_DEF } from '@angular/core';

import { AppModule, createModule } from './module';

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

export function setupModuleRootInjector(module: AppModule): InjectorContext {
  const injectorContext = new InjectorContext(
    module as unknown as InjectorModule,
  );
  injectorContext.getRootInjector(); //trigger all injector builds

  const modules = new Set<AppModule>();

  function findModules(module: AppModule) {
    if (modules.has(module)) return;
    modules.add(module);

    for (const m of module.getImports()) {
      findModules(m);
    }
  }

  findModules(module);

  for (const module of modules) {
    for (const setup of module.setups) {
      setup();
    }
  }

  modules.forEach(module => module.setups.forEach(setup => setup()));

  return injectorContext;
}

export function createStandaloneComponentModule<T>(
  component: Type<T>,
): AppModule {
  const componentDef: ɵComponentDef<T> | undefined =
    component[ɵNG_COMP_DEF as keyof typeof component];
  if (!componentDef?.standalone) {
    throw new Error(`${component.name} is not a standalone component`);
  }

  const imports = getImportedModules(componentDef);

  const module = new (class RootModule extends createModule({}) {})();

  module.addImport(...(imports as unknown as InjectorModule[]));

  module.addDeclaration(component);

  return module;
}

export function setupComponentRootInjector<T>(component: Type<T>): void {
  const rootModule = createStandaloneComponentModule(component);
  setupModuleRootInjector(rootModule);
}
