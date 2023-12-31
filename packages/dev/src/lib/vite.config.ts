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
        watch: {
          useFsEvents: true,
          atomic: 500,
          usePolling: false,
          awaitWriteFinish: true,
        },
      },
      mode: this.config.mode,
      build: {
        modulePreload: false,
        emptyOutDir: false,
        minify: false,
        target: 'esnext',
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
        deepkitType({
          tsConfig: this.config.tsconfig,
          compilerOptions: {
            sourceMap: true,
          },
        }),
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

  createForServer(): ViteConfig {
    const viteConfig = this.createBase();

    return mergeConfig(viteConfig, {
      build: {
        outDir: this.config.server.outDir,
        target: 'esnext',
        ssr: this.config.server.entry,
        rollupOptions: {
          input: this.config.server.entry,
        },
        watch: this.config.watch
          ? {
              include: [join(this.config.root, '**/*')],
            }
          : undefined,
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
      },
      build: {
        outDir: this.config.client.outDir,
        emptyOutDir: this.config.mode === 'production',
        rollupOptions: {
          input: this.config.client.entry,
        },
        watch: this.config.watch
          ? {
              include: [join(this.config.root, '**/*')],
            }
          : undefined,
      },
      plugins: [
        this.config.watch &&
          !this.config.client.hmr &&
          fullReload(join(this.config.root, '**/*'), {
            delay: this.config.client.fullReloadDelay,
          }),
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
