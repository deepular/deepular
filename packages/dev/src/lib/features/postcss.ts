import { AcceptedPlugin, ProcessOptions, Processor } from "postcss";
import { join } from 'node:path';

import { NgKitConfig, ViteConfig } from '../config';
import { requireIfExists } from '../utils';
import { NgKitViteConfig } from "../vite.config";
import { Feature } from './feature';
import { feature } from "./decorators";


export type PostCSSConfigPlugin = Transformer | Plugin | Processor;

export interface PostCSSConfig {
  parser?: string | ProcessOptions['parser'] | false;
  stringifier?: string | ProcessOptions['stringifier'] | false;
  syntax?: string | ProcessOptions['syntax'] | false;
  map?: string | false;
  from?: string;
  to?: string;
  plugins?: Array<PostCSSConfigPlugin | false> | Record<string, object | false>;
}

@feature.config('postcss')
export class PostCSSFeature implements Feature<PostCSSConfig> {

  constructor(private readonly config: NgKitConfig) {}

  getConfig(): PostCSSConfig {
    const twConfigFilePath = join(this.config.root, 'postcss.config.js');
    const twConfigFile = requireIfExists<PostCSSConfig>(twConfigFilePath);

    if (twConfigFile) return twConfigFile;

    return {
      plugins: [],
    }
  }

  apply(config: PostCSSConfig): ViteConfig {
    return {
      css: {
        transformer: 'postcss',
        // @ts-ignore
        postcss: config,
      }
    };
  }
}

