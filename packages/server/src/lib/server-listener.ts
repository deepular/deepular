import { HtmlResponse, RouteConfig, httpWorkflow } from '@deepkit/http';
import { readFile } from 'node:fs/promises';
import {
  renderApplication,
  ɵSERVER_CONTEXT as SERVER_CONTEXT,
} from '@angular/platform-server';
import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationRef } from '@angular/core';
import { eventDispatcher } from '@deepkit/event';

import { ServerConfig } from './config';
import { ServerModule } from './server.module';

export class ServerListener {
  constructor(
    private readonly config: ServerConfig,
    private readonly module: ServerModule,
  ) {}

  async bootstrap(): Promise<ApplicationRef> {
    return bootstrapApplication(this.config.rootComponent, this.config.app);
  }

  async render(url: string) {
    const document = this.config.documentPath
      ? await readFile(this.config.documentPath, 'utf8')
      : this.config.document;

    const html = await renderApplication(() => this.bootstrap(), {
      url,
      document,
      platformProviders: [
        {
          provide: SERVER_CONTEXT,
          useValue: 'deepkit',
        },
      ],
    });

    return new HtmlResponse(html);
  }

  @eventDispatcher.listen(httpWorkflow.onRoute, 101)
  async onRoute(event: typeof httpWorkflow.onRoute.event): Promise<void> {
    if (event.response.headersSent) return;
    if (event.route) return;
    event.routeFound(
      new RouteConfig('ngkit', ['GET'], event.url, {
        type: 'controller',
        controller: ServerListener,
        module: this.module,
        methodName: 'render',
      }),
      () => ({
        arguments: [event.url],
        parameters: {},
      }),
    );
  }
}
