import { cli, Command, flag } from '@deepkit/app';
import { installSourcemapsSupport } from 'vite-node/source-map';
import { createServer } from 'vite';
import { ViteNodeServer } from 'vite-node/server';
import { ViteNodeRunner } from 'vite-node/client';
import { createHotContext, handleMessage } from 'vite-node/hmr';
import { LoggerInterface } from '@deepkit/logger';
import { FetchResult } from 'vite-node';

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

  private async startClient() {
    const server = await createServer({
      logLevel: 'warn',
      ...this.viteConfig.client,
    });

    server.emitter?.on('error', payload => {
      console.error(payload);
    });

    server.emitter?.on('message', payload => {
      console.log(payload);
    });

    await server.listen();
  }

  private async startServer(): Promise<void> {
    const server = await createServer({
      logLevel: 'warn',
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
      async fetchModule(id) {
        return id.startsWith('/@fs/')
          ? (await node.transformRequest(id)) as FetchResult
          : await node.fetchModule(id);
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
        this.logger.error('<red>[ngkit] Failed to start server: \n</red>', err);
      });
    }
  }

  async execute(@flag watch?: boolean): Promise<void> {
    await Promise.all([this.startServer(), this.startClient()]);
  }
}
