#!/usr/bin/env node
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';

const require = createRequire(import.meta.url);

const ngKitCompilerPath = process.argv[2] || '@ngkit/compiler';

{
  const analogVitePluginAngularPath = require.resolve(
    '@analogjs/vite-plugin-angular/src/lib/angular-vite-plugin.js',
  );
  let analogVitePluginAngularFileContent = await readFile(
    analogVitePluginAngularPath,
    'utf8',
  );
  if (
    analogVitePluginAngularFileContent.includes(`('@angular/compiler-cli')`)
  ) {
    analogVitePluginAngularFileContent =
      analogVitePluginAngularFileContent.replace(
        `('@angular/compiler-cli')`,
        `('${ngKitCompilerPath}')`,
      );
    await writeFile(
      analogVitePluginAngularPath,
      analogVitePluginAngularFileContent,
      'utf8',
    );

    console.log(`Patched ${analogVitePluginAngularPath}`);
  }
}

{
  const angularCompilerCliPackageJsonPath = require.resolve(
    '@angular/compiler-cli/package.json',
  );

  const angularCompilerCliDir = dirname(angularCompilerCliPackageJsonPath);
  const angularCompilerCliBundlesDir = join(angularCompilerCliDir, 'bundles');

  const patchedByNgKitComment = '// Patched by NgKit\n';

  const paths = await readdir(angularCompilerCliBundlesDir);
  let bundleFileToPatch: { content: string; path: string } | undefined;
  let bundleFileAlreadyPatched: boolean = false;
  for (let path of paths) {
    path = join(angularCompilerCliBundlesDir, path);
    const stats = await stat(path);
    if (stats.isDirectory()) continue;

    const content = await readFile(path, 'utf8');
    if (content.includes(patchedByNgKitComment)) {
      bundleFileAlreadyPatched = true;
    }

    if (
      bundleFileAlreadyPatched ||
      (content.includes('new NgCompilerHost') &&
        content.includes('new NgtscProgram'))
    ) {
      bundleFileToPatch = { content, path };
      break;
    }
  }

  if (!bundleFileToPatch) {
    throw new Error(
      'Could not find @angular/compiler-cli bundle file to patch',
    );
  }

  if (!bundleFileAlreadyPatched) {
    const importNgKitCode = `
      let NgKitProgram;
      let NgKitCompilerHost;
      void new Promise(async () => {
        ({ NgKitProgram, NgKitCompilerHost } = await import('${ngKitCompilerPath}'));
      });
    `;

    bundleFileToPatch.content =
      patchedByNgKitComment + importNgKitCode + bundleFileToPatch.content;

    bundleFileToPatch.content = bundleFileToPatch.content.replace(
      'new NgtscProgram',
      `new NgKitProgram`,
    );
    bundleFileToPatch.content = bundleFileToPatch.content.replace(
      'new NgCompilerHost',
      `new NgKitCompilerHost`,
    );
    bundleFileToPatch.content = bundleFileToPatch.content.replace(
      'NgCompilerHost.wrap',
      `NgKitCompilerHost.wrap`,
    );

    await writeFile(bundleFileToPatch.path, bundleFileToPatch.content, 'utf8');

    console.log(`Patched ${bundleFileToPatch.path}`);
  }

  const angularCliPackageJson = require(angularCompilerCliPackageJsonPath);
  if (!('./src/ngtsc/core' in angularCliPackageJson.exports)) {
    const defaultPath = relative(angularCompilerCliDir, bundleFileToPatch.path);
    angularCliPackageJson.exports['./src/ngtsc/core'] = {
      types: './src/ngtsc/core/index.d.ts',
      default: `./${defaultPath}`,
    };
    await writeFile(
      angularCompilerCliPackageJsonPath,
      JSON.stringify(angularCliPackageJson, null, 2),
      'utf8',
    );

    console.log(`Patched ${angularCompilerCliPackageJsonPath}`);
  }
}

console.log('NgKit compiler successfully installed');
