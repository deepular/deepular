import { integer } from '@deepkit/type';
import vite from 'vite';
import vitest from 'vitest';
import { join } from 'path';

export type VitestConfig = vitest.ResolvedConfig;

export type ViteConfig = vite.UserConfigExport;

export class NgKitDevConfigServer {
  readonly outDir: string = join(this.root, 'dist');
  readonly entry: string = join(this.root, 'src/main.server.ts');

  constructor(private readonly root: string) {}
}

export class NgKitDevConfigClient {
  readonly outDir: string = join(this.root, 'dist/public');
  readonly entry: string = join(this.root, 'index.html');
  /**
   * @description client live reload delay in milliseconds
   * @default 500
   */
  readonly liveReloadDelay?: integer = 500;

  constructor(private readonly root: string) {}
}

export class NgKitDevConfig {
  readonly publicDir: string = join(this.root, 'src/public');
  readonly tsconfig: string = join(this.root, 'tsconfig.json');
  readonly watch: boolean = true;
  readonly mode: 'development' | 'production' | string =
    process.env['NODE_ENV'] || 'development';
  readonly server: NgKitDevConfigServer = new NgKitDevConfigServer(this.root);
  readonly client: NgKitDevConfigClient = new NgKitDevConfigClient(this.root);
  readonly test?: VitestConfig;

  constructor(readonly root = process.cwd()) {}
}
