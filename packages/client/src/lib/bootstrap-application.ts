import { bootstrapApplication as _bootstrapApplication } from '@angular/platform-browser';
import { RpcWebSocketClient } from '@deepkit/rpc';
import {
  ApplicationConfig,
  FactoryProvider,
  ɵNG_COMP_DEF,
  mergeApplicationConfig,
  ɵComponentDef,
  Type,
  APP_INITIALIZER,
  TransferState,
} from '@angular/core';

import { CORE_CONFIG, setupRootComponent } from '@ngkit/core';

import { ClientControllersModule } from './client-controllers.module';

export async function bootstrapApplication<T>(
  rootComponent: Type<T>,
  appConfig: ApplicationConfig = { providers: [] },
): Promise<void> {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const client = new RpcWebSocketClient(`${protocol}//${window.location.host}`);

  setupRootComponent(rootComponent, [new ClientControllersModule(client)]);

  const finalAppConfig: ApplicationConfig = mergeApplicationConfig(
    CORE_CONFIG,
    appConfig,
  );

  // const refetchers = import.meta.hot?.data.refetchers;

  if (import.meta.hot) {
    // import.meta.hot.data.refetchers = [];
    import.meta.hot.data.destroy?.();
    delete import.meta.hot.data.destroy;
  }

  const appRef = await _bootstrapApplication(rootComponent, finalAppConfig);

  if (import.meta.hot) {
    import.meta.hot!.data.refetch = false;

    // refetchers?.forEach((refetch: () => void) => refetch());

    const cmpDef = rootComponent[
      ɵNG_COMP_DEF as keyof typeof rootComponent
    ] as ɵComponentDef<T>;
    const cmpSelector = cmpDef.selectors[0][0];
    if (typeof cmpSelector !== 'string') {
      throw new Error(`${rootComponent.name} selector must be an element`);
    }

    const dispose = async () => {
      import.meta.hot!.data.destroy = () => {
        try {
          import.meta.hot!.data.refetch = true;
          appRef.destroy();
        } catch {
          /* empty */
        }
        if (!document.body.querySelector(cmpSelector)) {
          document.body.appendChild(document.createElement(cmpSelector));
        }
      };
    };

    import.meta.hot.on('vite:beforeFullReload', dispose);
    import.meta.hot.on('vite:beforeUpdate', dispose);
  }
}
