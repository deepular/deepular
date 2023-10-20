import { assert } from '@deepkit/type';
import { InjectorContext } from '@deepkit/injector';

import { NgKitConfig } from '../lib/config';
import { NgKitModule } from '../lib/module';
import { readConfigFile } from '../lib/read-config-file';
import { ServeController } from '../lib/cli';

interface ServeOptions extends Partial<NgKitConfig> {
  readonly config?: string;
}

export default async function serve(_options: ServeOptions) {
  assert<ServeOptions>(_options);

  const { config: configFile, ...options } = _options;

  const config = await readConfigFile(configFile, options);

  const module = new NgKitModule(config);

  const injector = new InjectorContext(module);

  const ctrl = injector.get(ServeController);

  await ctrl.execute();

  return { success: true };
}
