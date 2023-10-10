import { ViteConfig } from '../config';

export interface Feature<T> {
  getConfig?(): T;

  applyConfig(config: T | undefined, viteConfig: ViteConfig): ViteConfig;
}
