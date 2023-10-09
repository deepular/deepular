import { cli, Command, flag } from '@deepkit/app';
import { installSourcemapsSupport } from 'vite-node/source-map';
import { build, createServer, UserConfigExport } from 'vite';
import { ViteNodeServer } from 'vite-node/server';
import { ViteNodeRunner } from 'vite-node/client';
import { createHotContext, handleMessage } from 'vite-node/hmr';
import { LoggerInterface } from '@deepkit/logger';

import { NgKitDevConfig } from '../config';
import { readNgKitDevConfigFile } from '../read-ng-kit-dev-config-file';
import { createClientViteConfig, createServerViteConfig } from '../vite.config';

@cli.controller('serve', {
  description: 'Serve your application',
})
export class ServeController implements Command {
  constructor(private readonly logger: LoggerInterface) {}

  private async startServer(config: NgKitDevConfig): Promise<void> {
    const viteConfig = await createServerViteConfig(config);

    const server = await createServer({
      logLevel: 'error',
      ...viteConfig,
    });
    await server.pluginContainer.buildStart({});

    const node = new ViteNodeServer(server);

    installSourcemapsSupport({
      getSourceMap: source => node.getSourceMap(source),
    });

    const runner = new ViteNodeRunner({
      root: server.config.root,
      base: server.config.base,
      fetchModule(id) {
        return node.fetchModule(id);
      },
      resolveId(id, importer) {
        return node.resolveId(id, importer);
      },
      createHotContext(runner, url) {
        return createHotContext(
          runner,
          server.emitter,
          [config.entry.server],
          url,
        );
      },
    });

    // provide the vite define variable in this context
    await runner.executeId('/@vite/env');

    await runner.executeFile(config.entry.server);

    if (!config.watch) {
      await server.close();
    }

    server.emitter?.on('message', payload => {
      handleMessage(runner, server.emitter, [config.entry.server], payload);
    });

    if (config.watch) {
      process.on('uncaughtException', err => {
        this.logger.error('<red>[ngkit] Failed to execute file: \n</red>', err);
      });
    }
  }

  private async buildClient(config: NgKitDevConfig) {
    const viteConfig = await createClientViteConfig(config);
    const watcherOrOutput = await build(viteConfig);

    if ('on' in watcherOrOutput) {
      await new Promise<boolean>(resolve => {
        let success = true;
        watcherOrOutput.on('event', event => {
          if (event.code === 'START') {
            success = true;
          } else if (event.code === 'ERROR') {
            success = false;
          } else if (event.code === 'END') {
            resolve(success);
          }
          // result must be closed when present.
          // see https://rollupjs.org/guide/en/#rollupwatch
          if ('result' in event) {
            event.result?.close();
          }
        });
      });
    }
  }

  async execute(@flag c?: string, @flag watch: boolean = true): Promise<void> {
    const config = await readNgKitDevConfigFile(c, { watch });
    await this.startServer(config);
    await this.buildClient(config);
  }
}
