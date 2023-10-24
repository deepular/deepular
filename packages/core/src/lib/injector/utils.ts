import { InjectorContext, InjectorModule } from '@deepkit/injector';
import { Type, ɵComponentDef, ɵNG_COMP_DEF } from '@angular/core';

import { AppModule, createModule } from './module';

export function getComponentDependencies<T>(
  cmp: Type<T>,
): (Type<any> | AppModule)[] {
  const cmpDef = cmp[ɵNG_COMP_DEF as keyof typeof cmp] as ɵComponentDef<T>;

  return (
    ((typeof cmpDef.dependencies === 'function'
      ? cmpDef.dependencies()
      : cmpDef.dependencies) as (Type<any> | AppModule)[]) || []
  );
}

export function getImportedAppModulesInComponent<T>(
  cmp: Type<T>,
): AppModule<any>[] {
  const deps = getComponentDependencies(cmp);
  return deps.filter((dep): dep is AppModule => dep instanceof AppModule);
}

export function setupRootInjector<T>(rootCmp: Type<T>) {
  const rootModules = getImportedAppModulesInComponent(rootCmp);

  const rootModule = new (class RootAppModule extends createModule({}) {
    override imports = rootModules;
  })();

  const injectorContext = new InjectorContext(
    rootModule as unknown as InjectorModule,
  );
  injectorContext.getRootInjector(); //trigger all injector builds

  const modules = new Set<AppModule>();

  function findModules(module: AppModule<any>) {
    if (modules.has(module)) return;
    modules.add(module);

    for (const m of module.getImports()) {
      findModules(m);
    }
  }

  findModules(rootModule);

  for (const module of modules) {
    for (const setup of module.setups) {
      setup();
    }
  }

  modules.forEach(module => module.setups.forEach(setup => setup()));
}
