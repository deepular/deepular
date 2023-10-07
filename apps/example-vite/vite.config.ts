/// <reference types="vitest" />
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import { vavite } from 'vavite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import angular from '@analogjs/vite-plugin-angular';
import { deepkitType } from '@deepkit/vite';
import { join } from 'node:path';
import { json } from 'stream/consumers';

// Only run in Netlify CI
if (process.env['NETLIFY'] === 'true') {
  let base = process.env['URL'];

  if (process.env['CONTEXT'] === 'deploy-preview') {
    base = `${process.env['DEPLOY_PRIME_URL']}/`;
  }

  // set process.env.VITE_ANALOG_PUBLIC_BASE_URL = base URL
  process.env['VITE_ANALOG_PUBLIC_BASE_URL'] = base;
}

export default defineConfig(({ mode, ssrBuild }) => {
  return {
    publicDir: 'src/public',
    build: {
      target: ['esnext'],
      modulePreload: false,
      minify: false,
      rollupOptions: {
        preserveEntrySignatures: 'strict',
        output: {
          esModule: true,
          format: 'esm',
        },
        input: ssrBuild
          ? join(__dirname, 'src/server/main.server.ts')
          : join(__dirname, 'index.html'),
      },
    },
    resolve: {
      mainFields: ['module'],
    },
    optimizeDeps: {
      include: ['@angular/forms'],
    },
    plugins: [
      angular(),
      deepkitType(),
      nxViteTsPaths(),
      visualizer() as Plugin,
      /*vavite({
        handlerEntry: join(__dirname, "./src/main.server.ts"),
        serveClientAssetsInDev: true,
      }),*/
      !ssrBuild && splitVendorChunkPlugin(),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      cache: {
        dir: `../../node_modules/.vitest`,
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
