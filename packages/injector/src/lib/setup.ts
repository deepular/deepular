import { APP_INITIALIZER, FactoryProvider } from '@angular/core';

import { AppModule, appModules } from './module';
import { InjectorContext, InjectorModule } from '@deepkit/injector';

export const ngRegisterAppModules: FactoryProvider = {
  provide: APP_INITIALIZER,
  multi: true,
  useFactory() {
    return () => {
      const rootModule = [...appModules.values()].at(-1);
      if (!rootModule) {
        throw new Error('Root module is missing');
      }

      const injectorContext = new InjectorContext(
        rootModule as unknown as InjectorModule,
      );
      injectorContext.getRootInjector(); //trigger all injector builds

      appModules.forEach(appModule =>
        appModule.setups.forEach(setup => setup()),
      );
    };
  },
} as const;
