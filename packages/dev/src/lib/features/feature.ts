import { ViteConfig } from '../config';

export interface Feature<T> {
  getConfig?(): T;

  apply(config: T | undefined, viteConfig: ViteConfig): ViteConfig;
}
