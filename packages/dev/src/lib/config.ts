import { integer } from '@deepkit/type';
import vite from 'vite';
import vitest from 'vitest';
import { join } from 'path';

export type VitestConfig = vitest.ResolvedConfig;

export type ViteConfig = vite.UserConfigExport;

export class NgDevKitConfigEntry {
  readonly server: string = 'src/main.server.ts';
  readonly client: string = 'index.html';
}

export class NgKitDevConfig {
  readonly publicDir: string = join(this.root, 'src/public');
  readonly tsconfig: string = join(this.root, 'tsconfig.json');
  readonly outDir: string = 'dist';
  readonly watch: boolean = true;
  readonly mode: 'development' | 'production' | string =
    process.env['NODE_ENV'] || 'development';
  readonly entry: NgDevKitConfigEntry = new NgDevKitConfigEntry();
  /**
   * @description client live reload delay in milliseconds
   * @default 500
   */
  readonly clientLiveReloadDelay?: integer = 500;
  // Use Nx integration
  readonly nx?: boolean;
  // readonly server?: ViteConfig;
  // readonly client?: ViteConfig;
  readonly test?: VitestConfig;

  constructor(readonly root = process.cwd()) {}
}
