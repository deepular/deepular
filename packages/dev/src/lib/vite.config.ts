import _angular from '@analogjs/vite-plugin-angular';
import { deepkitType } from '@deepkit/vite';
import liveReload from 'rollup-plugin-livereload';
import { viteNodeHmrPlugin } from 'vite-node/hmr';
import { splitVendorChunkPlugin, UserConfig, Plugin } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

import { NgKitDevConfig } from './config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const angular = _angular.default as typeof _angular;

export async function createServerViteConfig(
  config: NgKitDevConfig,
): Promise<UserConfig> {
  const viteConfig = await createBaseViteConfig(config);

  if (config.watch) {
    viteConfig.plugins!.push(viteNodeHmrPlugin());
  }

  viteConfig.build!.rollupOptions!.input = config.server.entry;
  viteConfig.build!.outDir = config.server.outDir;

  return viteConfig;
}

export async function createClientViteConfig(
  config: NgKitDevConfig,
): Promise<UserConfig> {
  const viteConfig = await createBaseViteConfig(config);

  if (config.watch) {
    viteConfig.plugins!.push(
      liveReload({ delay: config.client.liveReloadDelay }) as Plugin,
    );
  }
  viteConfig.plugins!.push(splitVendorChunkPlugin());

  viteConfig.build!.outDir = config.client.outDir;
  viteConfig.build!.rollupOptions!.input = config.client.entry;

  return viteConfig;
}

export async function createBaseViteConfig(
  config: NgKitDevConfig,
): Promise<UserConfig> {
  return {
    publicDir: config.publicDir,
    server: {
      hmr: config.watch,
    },
    build: {
      modulePreload: false,
      minify: false,
      rollupOptions: {
        preserveEntrySignatures: 'strict',
        output: {
          esModule: true,
          format: 'esm',
          ...(config.mode === 'development'
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
      angular({ tsconfig: config.tsconfig }),
      deepkitType({ tsConfig: config.tsconfig }),
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
      'import.meta.vitest': config.mode !== 'production',
    },
  };
}
