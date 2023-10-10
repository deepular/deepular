// SSR dev server, middleware and error page source modified from
// https://github.com/solidjs/solid-start/blob/main/packages/start/dev/server.js

import { Connect, Plugin, ViteDevServer } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import { NgKitConfig } from '@ngkit/dev';

interface ServerOptions {
  index?: string;
  entryServer?: string;
}

export function devServerPlugin(config: NgKitConfig): Plugin {
  return {
    name: 'ngkit-dev-ssr-plugin',
    config() {
      return {
        resolve: {
          alias: {
            '~ngkit/entry-server': config.server.entry,
          },
        },
      };
    },
    configureServer(viteServer) {
      return async () => {
        removeHtmlMiddlewares(viteServer.middlewares);

        viteServer.middlewares.use(async (req, res) => {
          let template = fs.readFileSync(config.client.entry, 'utf-8');

          template = await viteServer.transformIndexHtml(
            req.originalUrl as string,
            template,
          );

          try {
            const entryServer = (
              await viteServer.ssrLoadModule('~ngkit/entry-server')
            )['default'];
            const result = await entryServer(req.originalUrl, template);
            res.end(result);
          } catch (e) {
            viteServer?.ssrFixStacktrace(e as Error);
            res.statusCode = 500;
            res.end(`
              <!DOCTYPE html>
              <html lang="en">
                <head>
                  <meta charset="UTF-8" />
                  <title>Error</title>
                  <script type="module">
                    import { ErrorOverlay } from '/@vite/client'
                    document.body.appendChild(new ErrorOverlay(${JSON.stringify(
                      prepareError(req, e),
                    ).replace(/</g, '\\u003c')}))
                  </script>
                </head>
                <body>
                </body>
              </html>
            `);
          }
        });
      };
    },
  };
}

/**
 * Removes Vite internal middleware
 *
 * @param server
 */
function removeHtmlMiddlewares(server: ViteDevServer['middlewares']) {
  const middlewares = [
    'viteIndexHtmlMiddleware',
    'vite404Middleware',
    'viteSpaFallbackMiddleware',
  ];
  for (let i = server.stack.length - 1; i > 0; i--) {
    // @ts-ignore
    if (middlewares.includes(server.stack[i].handle.name)) {
      server.stack.splice(i, 1);
    }
  }
}

/**
 * Formats error for SSR message in error overlay
 * @param req
 * @param error
 * @returns
 */
function prepareError(req: Connect.IncomingMessage, error: unknown) {
  const e = error as Error;
  return {
    message: `An error occured while server rendering ${req.url}:\n\n\t${
      typeof e === 'string' ? e : e.message
    } `,
    stack: typeof e === 'string' ? '' : e.stack,
  };
}
