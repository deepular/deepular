import { bootstrapApplication as _bootstrapApplication } from '@angular/platform-browser';
import { RpcWebSocketClient, RpcClient } from '@deepkit/rpc';
import {
  ApplicationConfig,
  ɵNG_COMP_DEF,
  ɵComponentDef,
  Type, PLATFORM_ID,
} from '@angular/core';

import {
  CORE_CONFIG,
  setupRootComponent,
  mergeApplicationConfig,
  provideRouter,
} from '@deepular/core';

import { ClientControllersModule } from './client-controllers.module';

export async function bootstrapApplication<T>(
  rootComponent: Type<T>,
  router: ReturnType<typeof provideRouter>,
  appConfig?: ApplicationConfig,
): Promise<void> {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const client = new RpcWebSocketClient(`${protocol}//${window.location.host}`);

  const clientControllersModule = new ClientControllersModule(client);
  setupRootComponent(rootComponent, {
    imports: [clientControllersModule],
    providers: [
      {
        provide: RpcClient,
        useValue: client,
      },
    ],
  });

  const ngAppConfig = mergeApplicationConfig(CORE_CONFIG, appConfig, {
    providers: [router(clientControllersModule)],
  });

  // const refetchers = import.meta.hot?.data.refetchers;

  if (import.meta.hot) {
    // import.meta.hot.data.refetchers = [];
    import.meta.hot.data.destroy?.();
    delete import.meta.hot.data.destroy;
  }

  const appRef = await _bootstrapApplication(rootComponent, ngAppConfig);

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
