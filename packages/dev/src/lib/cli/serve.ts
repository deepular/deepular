import { cli, Command, flag } from '@deepkit/app';
import { installSourcemapsSupport } from 'vite-node/source-map';
import { build, createServer } from 'vite';
import { ViteNodeServer } from 'vite-node/server';
import { ViteNodeRunner } from 'vite-node/client';
import { createHotContext, handleMessage } from 'vite-node/hmr';
import { LoggerInterface } from '@deepkit/logger';
import { InjectorContext, ServiceContainer } from '@deepkit/injector';

import { NgKitConfig } from '../config';
import { NgKitViteConfig } from '../vite.config';

@cli.controller('serve', {
  description: 'Develop your application',
})
export class ServeController implements Command {
  constructor(
    private readonly logger: LoggerInterface,
    private readonly config: NgKitConfig,
    private readonly viteConfig: NgKitViteConfig,
  ) {}

  private async startServer(): Promise<void> {
    const server = await createServer({
      logLevel: 'error',
      ...this.viteConfig.server,
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
      createHotContext: (runner, url) => {
        return createHotContext(
          runner,
          server.emitter,
          [this.config.server.entry],
          url,
        );
      },
    });

    // provide the vite define variable in this context
    await runner.executeId('/@vite/env');

    await runner.executeFile(this.config.server.entry);

    if (!this.config.watch) {
      await server.close();
    }

    server.emitter?.on('message', payload => {
      handleMessage(
        runner,
        server.emitter,
        [this.config.server.entry],
        payload,
      );
    });

    if (this.config.watch) {
      process.on('uncaughtException', err => {
        // FIXME: entry file gets executed multiple times
        this.logger.error('<red>[ngkit] Failed to start server: \n</red>', err);
      });
    }
  }

  private async buildClient() {
    const watcherOrOutput = await build(this.viteConfig.client);

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
    await this.startServer();
    await this.buildClient();
  }
}
