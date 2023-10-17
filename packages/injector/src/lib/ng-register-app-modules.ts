import {
  APP_INITIALIZER,
  FactoryProvider,
  Type,
  ɵComponentDef,
  ɵNG_COMP_DEF,
} from '@angular/core';

import { AppModule, createModule } from './module';
import { InjectorContext, InjectorModule } from '@deepkit/injector';

export function ngRegisterAppModules<T>(rootCmp: Type<T>): FactoryProvider {
  return {
    provide: APP_INITIALIZER,
    multi: true,
    useFactory() {
      return () => {
        const cmpDef = rootCmp[
          ɵNG_COMP_DEF as keyof typeof rootCmp
        ] as ɵComponentDef<T>;

        const deps = (
          typeof cmpDef.dependencies === 'function'
            ? cmpDef.dependencies()
            : cmpDef.dependencies
        ) as (Type<any> | AppModule)[] | null;
        const imports = (deps || []).filter(
          (dep): dep is AppModule => dep instanceof AppModule,
        );

        const rootModule = new (class extends createModule({}, 'root') {
          override imports = imports;
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

        modules.forEach(appModule =>
          appModule.setups.forEach(setup => setup()),
        );
      };
    },
  } as const;
}
