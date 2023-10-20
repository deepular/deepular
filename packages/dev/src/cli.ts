#!/usr/bin/env node
import { App } from '@deepkit/app';

import { readConfigFile } from './lib/read-config-file';
import { NgKitModule } from './lib/module';

// TODO: merge cli flags
const config = await readConfigFile();

await new App({
  imports: [new NgKitModule(config)],
}).run();
