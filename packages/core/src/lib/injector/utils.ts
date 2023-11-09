import {
  FactoryProvider,
  isClassProvider,
  isFactoryProvider,
} from '@deepkit/injector';
import {
  inject,
  ɵComponentDef,
  ɵNG_COMP_DEF,
  ɵNG_INJ_DEF,
  ɵNG_MOD_DEF,
  ɵNgModuleDef,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵInjectorDef,
} from '@angular/core';
import { AbstractClassType, ClassType, isClass } from '@deepkit/core';
import {
  reflect,
  ReflectionKind,
  TypeClass,
  TypeMethod,
  TypeParameter,
} from '@deepkit/type';

import { ServiceContainer } from './service-container';
import {
  AppModule,
  createModule,
  NgModuleType,
  ProviderWithScope,
} from './module';
import { processRoute, Routes } from '../router';

export function getComponentDependencies<T>(
  componentDef: ɵComponentDef<T>,
): (ClassType<unknown> | AppModule)[] {
  return (
    ((typeof componentDef.dependencies === 'function'
      ? componentDef.dependencies()
      : componentDef.dependencies) as (ClassType<unknown> | AppModule)[]) || []
  );
}

export function setNgModuleDef(
  type: any,
  def: Parameters<typeof ɵɵdefineNgModule>[0],
) {
  type[ɵNG_MOD_DEF] = ɵɵdefineNgModule(def);
}

export function setInjectorDef(
  type: any,
  def: Parameters<typeof ɵɵdefineInjector>[0],
) {
  type[ɵNG_INJ_DEF] = ɵɵdefineInjector(def);
}

export function getNgModuleDef(type: any): ɵNgModuleDef<any> | null {
  return type[ɵNG_MOD_DEF] || null;
}

export function getInjectorDef(type: any): ɵɵInjectorDef<any> | null {
  return type[ɵNG_INJ_DEF] || null;
}

export function getComponentDef<T>(type: ClassType<T>): ɵComponentDef<T> | null {
  return type[ɵNG_COMP_DEF as keyof typeof type] || null;
}

export function getImportedModules<T>(
  componentDef: ɵComponentDef<T>,
): AppModule[] {
  const deps = getComponentDependencies(componentDef);
  return deps.filter((dep): dep is AppModule => dep instanceof AppModule);
}

// TODO: recursively create modules for imported standalone components
export function createStandaloneComponentModule<T>(
  component: ClassType<T>,
): AppModule<any> {
  const componentDef = getComponentDef(component);
  if (!componentDef?.['standalone']) {
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

export function convertNgModule<T>(ngModule: NgModuleType<T>): AppModule<any> {
  const ngModuleDef = getNgModuleDef(ngModule);
  if (!ngModuleDef) {
    throw new Error(`${ngModule} is not a NgModule`);
  }
  const injectorDef = getInjectorDef(ngModule);

  const ngImports =
    typeof ngModuleDef.imports === 'function'
      ? ngModuleDef.imports()
      : ngModuleDef.imports;

  const declarations =
    typeof ngModuleDef.declarations === 'function'
      ? ngModuleDef.declarations()
      : ngModuleDef.declarations;

  const exports =
    typeof ngModuleDef.exports === 'function'
      ? ngModuleDef.exports()
      : ngModuleDef.exports;

  const providers = (injectorDef?.providers || []).map(provider =>
    isClass(provider)
      ? provider
      : 'provide' in provider
      ? provider.provide
      : (provider as any),
  );

  const ngModuleClassType =
    'ngModule' in ngModule ? ngModule.ngModule : ngModule;

  return new (class extends createModule(
    {
      declarations,
      providers,
      exports: [...providers, ...exports],
    },
    ngModuleClassType.name,
  ) {
    override ngImports = ngImports;
  })();
}

export function setupRootComponent<T>(
  component: ClassType<T>,
  { modules, routes }: { modules?: readonly AppModule[]; routes?: Routes; } = {},
): ServiceContainer {
  const rootModule = createStandaloneComponentModule(component);
  const serviceContainer = new ServiceContainer(rootModule);
  modules?.forEach(module => {
    if (!module.root) {
      throw new Error('Only root modules are allowed');
    }
    serviceContainer.appModule.addImport(module);
  })
  if (routes) {
    for (const route of routes) {
      processRoute(route, serviceContainer);
    }
  }
  serviceContainer.process();
  return serviceContainer;
}

export function provideNgDeclarationDependency<T>(
  type: AbstractClassType<T>,
): FactoryProvider<T> {
  return {
    provide: type,
    transient: true,
    useFactory: () => {
      try {
        return inject(type);
      } catch {
        throw new Error(
          `${type.name} is only allowed as a dependency for declarations`,
        );
      }
    },
  };
}

export function provideNgDependency<T>(
  type: AbstractClassType<T>,
): FactoryProvider<T> {
  return {
    provide: type,
    transient: true,
    useFactory: () => inject(type),
  };
}

export function getClassConstructorParameters(
  type: TypeClass,
): readonly TypeParameter[] {
  const constructor = type.types.find(
    type => type.kind === ReflectionKind.method && type.name === 'constructor',
  );
  return constructor?.kind === ReflectionKind.method
    ? constructor.parameters
    : [];
}

export function getProviderFactoryParameters(
  provider: ProviderWithScope,
): readonly TypeParameter[] {
  if (isFactoryProvider(provider)) {
    const type = reflect(provider.useFactory) as TypeMethod;
    return type.parameters;
  }

  if (isClassProvider(provider)) {
    const type = reflect(provider.useClass) as TypeClass;
    return getClassConstructorParameters(type);
  }

  if (isClass(provider)) {
    const type = reflect(provider) as TypeClass;
    return getClassConstructorParameters(type);
  }

  return [];
}
