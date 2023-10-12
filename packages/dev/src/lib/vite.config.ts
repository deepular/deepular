import { join } from 'node:path';
import _angular from '@analogjs/vite-plugin-angular';
import { deepkitType } from '@deepkit/vite';
import fullReload from 'vite-plugin-full-reload';
import { mergeConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';
import { viteNodeHmrPlugin } from 'vite-node/hmr';
import type { Writable } from 'type-fest';

import { NgKitConfig, ViteConfig } from './config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const angular = _angular.default as typeof _angular;

export class NgKitViteConfig {
  readonly client: ViteConfig = this.createForClient();
  readonly server: ViteConfig = this.createForServer();

  constructor(private readonly config: NgKitConfig) {}

  createBase(): ViteConfig {
    return {
      publicDir: this.config.publicDir,
      server: {
        hmr: this.config.watch,
      },
      mode: this.config.mode,
      build: {
        modulePreload: false,
        minify: false,
        rollupOptions: {
          preserveEntrySignatures: 'strict',
          output: {
            esModule: true,
            format: 'esm',
            ...(this.config.mode === 'development'
              ? {
                  entryFileNames: `[name].js`,
                  chunkFileNames: `[hash].js`,
                  assetFileNames: `[name].[ext]`,
                }
              : {}),
          },
        },
      },
      resolve: {
        mainFields: ['module'],
      },
      plugins: [
        nxViteTsPaths(),
        angular({ tsconfig: this.config.tsconfig }),
        deepkitType({ tsConfig: this.config.tsconfig }),
      ],
      // test: {
      //   globals: true,
      //   environment: 'jsdom',
      //   setupFiles: ['src/test-setup.ts'],
      //   include: ['**/*.spec.ts'],
      //   cache: {
      //     dir: `../../node_modules/.cache/vitest`,
      //   },
      // },
      define: {
        __PROD__: this.config.mode === 'production',
        __DEV__: this.config.mode !== 'production',
        // ngDevMode: this.config.mode !== 'production',
        'import.meta.vitest': this.config.mode !== 'production',
      },
    };
  }

  createForServerSideRendering(): ViteConfig {
    const viteConfig = this.createBase();

    return mergeConfig(viteConfig, {
      build: {
        outDir: join(this.config.server.outDir, 'ssr'),
        ssr: this.config.server.entry,
        rollupOptions: {
          input: this.config.server.entry,
        },
      },
    } as ViteConfig);
  }

  createForServer(): ViteConfig {
    const viteConfig = this.createBase();

    return mergeConfig(viteConfig, {
      server: {
        watch: {
          useFsEvents: true,
          atomic: 500,
          usePolling: false,
          awaitWriteFinish: true,
        },
        /*proxy: {
          '/public': {
            target: 'http://localhost:4200',
            changeOrigin: true,
            rewrite: path => path.replace(/^\/public/, '')
          }
        },*/
      },
      build: {
        outDir: this.config.server.outDir,
        // ssr: this.config.server.entry,
        // rollupOptions: {
        //   input: this.config.server.entry,
        // },
        // watch: {
        //   exclude: [this.config.client.entry],
        // },
      },
      plugins: [this.config.watch && viteNodeHmrPlugin()],
    } as ViteConfig);
  }

  createForClient(): ViteConfig {
    const viteConfig = this.createBase();

    return mergeConfig(viteConfig, {
      server: {
        hmr: this.config.client.hmr,
        port: 4200,
        watch: {
          useFsEvents: true,
          atomic: 500,
          usePolling: false,
          awaitWriteFinish: true,
        },
      },
      build: {
        outDir: this.config.client.outDir,
        emptyOutDir: this.config.mode === 'production',
        rollupOptions: {
          input: this.config.client.entry,
        },
        watch: {
          include: [join(this.config.root, '**/*')],
        },
      },
      plugins: [
        this.config.watch && !this.config.client.hmr && fullReload(join(this.config.root, '**/*'), { delay: this.config.client.fullReloadDelay }),
        chunkSplitPlugin({ strategy: 'unbundle' }),
      ],
    } as ViteConfig);
  }

  applyToClient(
    this: Writable<this>,
    fn: (config: ViteConfig) => ViteConfig,
  ): void {
    this.client = mergeConfig(this.client as ViteConfig, fn(this.client));
  }

  applyToServer(
    this: Writable<this>,
    fn: (config: ViteConfig) => ViteConfig,
  ): void {
    this.server = mergeConfig(this.server as ViteConfig, fn(this.server));
  }

  apply(fn: (config: ViteConfig) => ViteConfig): void {
    this.applyToServer(fn);
    this.applyToClient(fn);
  }
}
