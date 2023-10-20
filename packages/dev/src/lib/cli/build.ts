import { cli, Command } from '@deepkit/app';
import { build } from 'vite';
import { LoggerInterface } from '@deepkit/logger';

import { NgKitConfig } from '../config';
import { NgKitViteConfig } from '../vite.config';

@cli.controller('build', {
  description: 'Build your application',
})
export class BuildController implements Command {
  constructor(
    private readonly logger: LoggerInterface,
    private readonly config: NgKitConfig,
    private readonly viteConfig: NgKitViteConfig,
  ) {}

  private async buildServer() {
    const watcherOrOutput = await build(this.viteConfig.server);

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

  async execute(): Promise<void> {
    await Promise.all([this.buildServer(), this.buildClient()]);
  }
}
