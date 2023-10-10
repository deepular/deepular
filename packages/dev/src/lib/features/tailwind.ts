import { join } from 'node:path';
import { Config as TailwindConfig } from 'tailwindcss';

import { NgKitConfig, ViteConfig } from '../config';
import { requireIfExists } from '../utils';
import { NgKitViteConfig } from '../vite.config';
import { feature } from './decorators';
import { Feature } from './feature';
import { PostCSSConfig, PostCSSFeature } from './postcss';

@feature.config('tailwind', {
  requires: [PostCSSFeature],
})
export class TailwindFeature implements Feature<TailwindConfig> {
  constructor(private readonly config: NgKitConfig) {}

  getConfig(): TailwindConfig {
    const twConfigFilePath = join(this.config.root, 'tailwind.config.js');
    const twConfigFile = requireIfExists<TailwindConfig>(twConfigFilePath);

    if (twConfigFile) return twConfigFile;

    return {
      content: [join(this.config.root, 'src/**/*.{html,ts,css,scss,less}')],
      theme: {
        extend: {},
      },
      plugins: [],
    };
  }

  applyConfig(config: TailwindConfig): ViteConfig {
    return {
      css: {
        postcss: {
          plugins: {
            tailwindcss: config,
          },
        } as PostCSSConfig,
      },
    } as ViteConfig;
  }
}
