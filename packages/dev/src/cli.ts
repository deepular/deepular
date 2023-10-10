#!/usr/bin/env node
import { App } from '@deepkit/app';
import { FrameworkModule } from '@deepkit/framework';

import { ServeController } from './lib/cli';
import { NgKitConfig } from './lib/config';
import { readConfigFile } from './lib/read-config-file';
import {
  FeaturesModule,
  PostCSSFeature,
  TailwindFeature,
} from './lib/features';
import { NgKitViteConfig } from './lib/vite.config';

const configFilePath = process.argv[2];

// TODO: merge cli flags
const config = await readConfigFile(configFilePath);

await new App({
  config: NgKitConfig,
  imports: [new FeaturesModule()],
  providers: [NgKitViteConfig, PostCSSFeature, TailwindFeature],
  controllers: [ServeController],
})
  .configure(config)
  .run();
