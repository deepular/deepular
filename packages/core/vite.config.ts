/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { angular } from '@analogjs/vite-plugin-angular/src/lib/angular-vite-plugin';
import { deepkitType } from '@deepkit/vite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tsconfig = join(__dirname, 'tsconfig.spec.json');

export default defineConfig(({ mode }) => ({
  cacheDir: '../../node_modules/.vite/core',
  plugins: [
    nxViteTsPaths(),
    angular({ tsconfig }),
    deepkitType({
      tsConfig: tsconfig,
      compilerOptions: { sourceMap: true },
    }),
  ],
  test: {
    globals: true,
    cache: {
      dir: '../../node_modules/.vitest',
    },
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    deps: {
      optimizer: {
        web: {
          exclude: ['rxjs'],
        },
      }
    },
  },
  define: {
    'import.meta.vitest': mode !== 'production',
  },
}));
