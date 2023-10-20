import { assert } from '@deepkit/type';
import { InjectorContext } from '@deepkit/injector';

import { NgKitConfig } from '../lib/config';
import { NgKitModule } from '../lib/module';
import { readConfigFile } from '../lib/read-config-file';
import { BuildController } from '../lib/cli';

interface BuildOptions extends Partial<NgKitConfig> {
  readonly config?: string;
}

export default async function build(_options: BuildOptions) {
  assert<BuildOptions>(_options);

  const { config: configFile, ...options } = _options;

  const config = await readConfigFile(configFile, options);

  const module = new NgKitModule(config);

  const injector = new InjectorContext(module);

  const ctrl = injector.get(BuildController);

  await ctrl.execute();

  return { success: true };
}
