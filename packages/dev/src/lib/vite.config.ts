/// <reference types="vitest" />
import { join } from 'node:path';
import _angular from '@analogjs/vite-plugin-angular';
import { deepkitType } from '@deepkit/vite';
import liveReload from 'rollup-plugin-livereload';
import { viteNodeHmrPlugin } from 'vite-node/hmr';
import { splitVendorChunkPlugin, UserConfig, Plugin } from 'vite';

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
  viteConfig.build!.rollupOptions!.input = join(
    config.root,
    config.entry.server,
  );
  return viteConfig;
}

export async function createClientViteConfig(
  config: NgKitDevConfig,
): Promise<UserConfig> {
  const viteConfig = await createBaseViteConfig(config);
  if (config.watch) {
    viteConfig.plugins!.push(
      liveReload({ delay: config.clientLiveReloadDelay }) as Plugin,
    );
    viteConfig.plugins!.push(splitVendorChunkPlugin());
  }
  viteConfig.build!.rollupOptions!.input = join(
    config.root,
    config.entry.client,
  );
  return viteConfig;
}

export async function createBaseViteConfig(
  config: NgKitDevConfig,
): Promise<UserConfig> {
  const nxViteTsPaths =
    config.nx &&
    (await import('@nx/vite/plugins/nx-tsconfig-paths.plugin').then(m =>
      m.nxViteTsPaths(),
    ));

  return {
    publicDir: config.publicDir,
    server: {
      hmr: config.watch,
    },
    build: {
      modulePreload: false,
      minify: false,
      outDir: config.outDir,
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
      angular({ tsconfig: config.tsconfig }),
      deepkitType({ tsConfig: config.tsconfig }),
      nxViteTsPaths,
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      cache: {
        dir: `../../node_modules/.cache/vitest`,
      },
    },
    define: {
      'import.meta.vitest': config.mode !== 'production',
    },
  };
}
