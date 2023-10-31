import {
  FactoryProvider,
  isClassProvider,
  isFactoryProvider,
} from '@deepkit/injector';
import { inject, ɵComponentDef, ɵNG_COMP_DEF } from '@angular/core';
import { AbstractClassType, ClassType, isClass } from '@deepkit/core';
import {
  reflect,
  ReflectionKind,
  TypeClass,
  TypeMethod,
  TypeParameter,
} from '@deepkit/type';

import { AppModule, createModule, ProviderWithScope } from './module';
import { ServiceContainer } from './service-container';

export function getComponentDependencies<T>(
  componentDef: ɵComponentDef<T>,
): (ClassType<unknown> | AppModule)[] {
  return (
    ((typeof componentDef.dependencies === 'function'
      ? componentDef.dependencies()
      : componentDef.dependencies) as (ClassType<unknown> | AppModule)[]) || []
  );
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
  const componentDef: ɵComponentDef<T> | undefined =
    component[ɵNG_COMP_DEF as keyof typeof component];
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

export function setupRootComponent<T>(
  component: ClassType<T>,
  modules: readonly AppModule[] = [],
): ServiceContainer {
  const rootModule = createStandaloneComponentModule(component);
  const serviceContainer = new ServiceContainer(rootModule);
  if (modules.length) {
    for (const module of modules) {
      if (!module.root) {
        throw new Error('Only root modules are allowed');
      }
      serviceContainer.appModule.addImport(module);
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
