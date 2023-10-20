import { createRequire } from 'node:module';
import { join, relative, dirname } from 'node:path';
import { writeFile, readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);

const ngKitCompilerPath = process.argv[2];

const { applyPatchesForPackage } = require('patch-package/dist/applyPatches');
const { getGroupedPatches } = require('patch-package/dist/patchFs');

const appPath = process.cwd();
const patchDir = ngKitCompilerPath
  ? `${dirname(relative(appPath, ngKitCompilerPath))}/patches`
  : 'node_modules/@ngkit/compiler/patches';

const groupedPatches = getGroupedPatches(join(appPath, patchDir));

const errors: string[] = [];
const warnings: string[] = [...groupedPatches.warnings];

for (const patches of Object.values(
  groupedPatches.pathSpecifierToPatchFiles,
) as any[]) {
  applyPatchesForPackage({
    patches,
    appPath,
    patchDir,
    warnings,
    errors,
    bestEffort: false,
    reverse: false,
  });
}

for (const warning of warnings) {
  console.warn(warning);
}

for (const error of errors) {
  console.error(error);
}

if (warnings.length || errors.length) {
  process.exit(1);
}
