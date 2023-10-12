/// <reference types="vitest" />
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import angular from '@analogjs/vite-plugin-angular';
import { deepkitType } from '@deepkit/vite';
import liveReload from 'rollup-plugin-livereload';
import { join } from 'node:path';

export default defineConfig(({ mode, ssrBuild }) => {
  return {
    publicDir: 'src/public',
    build: {
      modulePreload: false,
      minify: false,
      rollupOptions: {
        preserveEntrySignatures: 'strict',
        output: {
          esModule: true,
          format: 'esm',
          ...(mode === 'development'
            ? {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
              }
            : {}),
        },
        input: ssrBuild
          ? join(__dirname, 'src/main.client.ts')
          : join(__dirname, 'index.html'),
      },
    },
    resolve: {
      mainFields: ['module'],
    },
    plugins: [
      angular(),
      deepkitType(),
      nxViteTsPaths(),
      visualizer() as Plugin,
      !ssrBuild && splitVendorChunkPlugin(),
      !ssrBuild && liveReload({ delay: 500 }),
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
      'import.meta.vitest': mode !== 'production',
      'import.meta.env.NX_WORKSPACE_ROOT': JSON.stringify(
        process.env.NX_WORKSPACE_ROOT!,
      ),
      'import.meta.env.NX_PROJECT_ROOT': JSON.stringify(
        join('apps', process.env.NX_TASK_TARGET_PROJECT!),
      ),
    },
  };
});
