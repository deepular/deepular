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

// TODO: merge cli flags
const config = await readConfigFile();

await new App({
  imports: [new FeaturesModule()],
  providers: [{ provide: NgKitConfig, useValue: config }, NgKitViteConfig, PostCSSFeature, TailwindFeature],
  controllers: [ServeController],
}).run();
