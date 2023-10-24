/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { angular } from '@analogjs/vite-plugin-angular/src/lib/angular-vite-plugin';
import { deepkitType } from '@deepkit/vite';

export default defineConfig(({ mode }) => ({
  cacheDir: '../../node_modules/.vite/core',
  plugins: [
    nxViteTsPaths(),
    // angular(),
    deepkitType(),
  ],
  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    setupFiles: ['src/test-setup.ts'],
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
