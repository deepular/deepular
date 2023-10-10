import _angular from '@analogjs/vite-plugin-angular';
import { deepkitType } from '@deepkit/vite';
import liveReload from 'rollup-plugin-livereload';
import { viteNodeHmrPlugin } from 'vite-node/hmr';
import { splitVendorChunkPlugin, Plugin, mergeConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

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
                chunkFileNames: `[name].js`,
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
        'import.meta.vitest': this.config.mode !== 'production',
      },
    };
  }

  createForServer() {
    const viteConfig = this.createBase();

    if (this.config.watch) {
      viteConfig.plugins!.push(viteNodeHmrPlugin());
    }

    return {
      ...viteConfig,
      build: {
        ...viteConfig.build,
        outDir: this.config.server.outDir,
        rollupOptions: {
          ...viteConfig.build?.rollupOptions,
          input: this.config.server.entry,
        }
      }
    }
  }

  createForClient(): ViteConfig {
    const viteConfig = this.createBase();

    if (this.config.watch) {
      viteConfig.plugins!.push(
        liveReload({ delay: this.config.client.liveReloadDelay }) as Plugin,
      );
    }
    viteConfig.plugins!.push(splitVendorChunkPlugin());

    viteConfig.build!.outDir = this.config.client.outDir;
    viteConfig.build!.rollupOptions!.input = this.config.client.entry;

    return viteConfig;
  }

  applyToClient(fn: (config: ViteConfig) => ViteConfig): void {
    (this as any).client = mergeConfig((this as any).client, fn((this as any).client));
  }

  applyToServer(fn: (config: ViteConfig) => ViteConfig): void {
    (this as any).server = mergeConfig((this as any).server, fn((this as any).server));
  }

  apply(fn: (config: ViteConfig) => ViteConfig): void {
    this.applyToServer(fn);
    this.applyToClient(fn);
  }
}
