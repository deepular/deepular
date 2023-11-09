/// <reference types="vite/client" />
import { ApplicationServer, FrameworkModule } from '@deepkit/framework';
import { ClassType } from '@deepkit/core';
import { RootModuleDefinition } from '@deepkit/app';
import { Logger } from '@deepkit/logger';
import { App } from '@deepkit/app';
import { createRouteConfig, Routes, setupRootComponent } from '@ngkit/core';

import { ServerModule } from './server.module';
import { ServerControllersModule } from './server-controllers.module';

export interface NgKitServerOptions extends RootModuleDefinition {
  readonly publicDir: string;
  readonly document?: string;
  readonly documentPath?: string;
  readonly routes: Routes;
}

export async function startServer(
  rootComponent: ClassType,
  {
    // Core
    routes,
    // App
    imports,
    controllers,
    listeners,
    providers,
    workflows,
    middlewares,
    // ServerModule
    publicDir,
    documentPath,
    document,
    // FrameworkModule
    ...frameworkOptions
  }: NgKitServerOptions,
): Promise<App<any>> {
  // TODO: this has to be created after routes have been processed. maybe use Router.resetConfig() instead
  const routeConfig = createRouteConfig(routes);

  const serverModule = new ServerModule({
    rootComponent,
    app: routeConfig,
    documentPath,
    document,
  });

  const app = new App({
    imports: [
      new FrameworkModule({
        publicDir,
        ...frameworkOptions,
      }),
      serverModule,
      ...(imports || []),
    ],
    controllers,
    listeners,
    providers,
    workflows,
    middlewares,
  });

  app.serviceContainer.process();

  const controllersModule = new ServerControllersModule(serverModule);
  setupRootComponent(rootComponent, {
    modules: [controllersModule],
    routes,
  });

  const logger = app.get(Logger);

  if (import.meta.hot) {
    const server = app.get(ApplicationServer);

    const dispose = async () => {
      let resolve: () => void;
      import.meta.hot!.data.shuttingDown = new Promise<void>(
        _resolve => (resolve = _resolve),
      );
      if (!import.meta.hot!.data.shuttingDownLogged) {
        logger.alert('Shutting down server ...');
      }
      import.meta.hot!.data.shuttingDownLogged = true;
      await server.close(true);
      resolve!();
    };

    import.meta.hot.on('vite:beforeFullReload', dispose);
    import.meta.hot.on('vite:beforeUpdate', dispose);
  }

  if (import.meta.hot?.data.shuttingDown) {
    logger.alert('Waiting for server to shutdown ...');
    await import.meta.hot.data.shuttingDown;
    import.meta.hot.data.shuttingDown = null;
    import.meta.hot!.data.shuttingDownLogged = null;
  }

  await app.run(['server:start']);

  return app;
}
