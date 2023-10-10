import { join } from 'node:path';
import { Config as TailwindConfig } from 'tailwindcss';
import { integer } from '@deepkit/type';
import vite from 'vite';
import vitest from 'vitest';

import { PostCSSConfig } from './features/postcss';

export type VitestConfig = vitest.ResolvedConfig;

export type ViteConfig = vite.UserConfig;

export class NgKitConfigServer {
  readonly outDir: string = join(this.root, 'dist');
  readonly entry: string = join(this.root, 'src/main.server.ts');

  constructor(private readonly root: string) {}
}

export class NgKitConfigClient {
  readonly outDir: string = join(this.root, 'dist/public');
  readonly entry: string = join(this.root, 'index.html');
  /**
   * @description client live reload delay in milliseconds
   * @default 500
   */
  readonly liveReloadDelay?: integer = 500;

  constructor(private readonly root: string) {}
}

export class NgKitConfigFeatures {
  // readonly nx: boolean = false;
  readonly tailwind: boolean | TailwindConfig = false;
  readonly postcss: boolean | PostCSSConfig = false;
}

export class NgKitConfig {
  readonly publicDir: string = join(this.root, 'src/public');
  readonly tsconfig: string = join(this.root, 'tsconfig.json');
  readonly watch: boolean = true;
  readonly mode: 'development' | 'production' | string =
    process.env['NODE_ENV'] || 'development';
  readonly server: NgKitConfigServer = new NgKitConfigServer(this.root);
  readonly client: NgKitConfigClient = new NgKitConfigClient(this.root);
  readonly features: NgKitConfigFeatures = new NgKitConfigFeatures();
  readonly test?: VitestConfig;

  constructor(readonly root = process.cwd()) {}
}
