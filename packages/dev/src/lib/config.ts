import { integer } from '@deepkit/type';
import vite from 'vite';
import vitest from 'vitest';
import { join } from 'path';

export type VitestConfig = vitest.ResolvedConfig;

export type ViteConfig = vite.UserConfigExport;

export class NgDevKitConfigEntry {
  readonly server: string = join(this.root, 'src/main.server.ts');
  readonly client: string = join(this.root, 'index.html');

  constructor(private readonly root: string) {}
}

export class NgKitDevConfig {
  readonly publicDir: string = join(this.root, 'src/public');
  readonly tsconfig: string = join(this.root, 'tsconfig.json');
  readonly outDir: string = join(this.root, 'dist');
  readonly watch: boolean = true;
  readonly mode: 'development' | 'production' | string =
    process.env['NODE_ENV'] || 'development';
  readonly entry: NgDevKitConfigEntry = new NgDevKitConfigEntry(this.root);
  /**
   * @description client live reload delay in milliseconds
   * @default 500
   */
  readonly clientLiveReloadDelay?: integer = 500;
  // readonly server?: ViteConfig;
  // readonly client?: ViteConfig;
  readonly test?: VitestConfig;

  constructor(readonly root = process.cwd()) {}
}
