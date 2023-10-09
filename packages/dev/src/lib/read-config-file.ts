import { join } from 'node:path';
import { stat } from 'node:fs/promises';
import { cast } from '@deepkit/type';
// import { readConfigFile } from '@jsheaven/read-config-file';

import { NgKitDevConfig } from './config';
import { dirname } from '@angular/compiler-cli';

const availableConfigFileExtensions = [
  'ts',
  'js',
  'mjs',
  'json',
  'json5',
] as const;
const defaultConfigFileName = 'ngkit.config';

export async function findDefaultConfigFilePath(
  root: string = process.cwd(),
): Promise<string | undefined> {
  for (const ext of availableConfigFileExtensions) {
    const path = join(root, `${defaultConfigFileName}.${ext}`);
    try {
      const stats = await stat(path);
      if (stats.isFile()) {
        return path;
      }
    } catch {
      /* empty */
    }
  }
  return undefined;
}

export async function readConfigFile(
  path?: string,
  override?: Partial<NgKitDevConfig>,
): Promise<NgKitDevConfig> {
  path ||= await findDefaultConfigFilePath();
  if (!path) {
    // throw new Error('Missing config file path');
    return new NgKitDevConfig();
  }

  // FIXME TypeError: vm.SourceTextModule is not a constructor
  // const config = await readConfigFile({
  //   configFilePath: path,
  // });
  let config = await import(path);
  config = 'default' in config ? config.default : config;
  const root = dirname(path);

  return cast<NgKitDevConfig>({ ...config, root });
}
