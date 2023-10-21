/// <reference types="vite/client" />
import { ApplicationServer, FrameworkModule } from '@deepkit/framework';
import { ClassType } from '@deepkit/core';
import { RootModuleDefinition } from '@deepkit/app';
import { Logger } from '@deepkit/logger';
import { App } from '@deepkit/app';
import { ApplicationConfig } from '@angular/core';

import { ServerModule } from './server.module';

export interface NgKitServerOptions extends RootModuleDefinition {
  readonly publicDir: string;
  readonly document?: string;
  readonly documentPath?: string;
}

export async function startServer(
  rootComponent: ClassType,
  {
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
  appConfig?: ApplicationConfig,
): Promise<App<any>> {
  const app = new App({
    imports: [
      new FrameworkModule({
        publicDir,
        ...frameworkOptions,
      }),
      new ServerModule({
        rootComponent,
        app: appConfig,
        documentPath,
        document,
      }),
      ...(imports || []),
    ],
    controllers,
    listeners,
    providers,
    workflows,
    middlewares,
  });

  const logger = app.get(Logger);

  if (import.meta.hot?.data.shuttingDown) {
    logger.alert('Waiting for server to shutdown ...');
    await import.meta.hot.data.shuttingDown;
    import.meta.hot.data.shuttingDown = null;
    import.meta.hot!.data.shuttingDownLogged = null;
  }

  await app.run(['server:start']);

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

  return app;
}
