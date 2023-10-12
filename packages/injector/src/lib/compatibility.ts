import { ɵNgModuleDef } from '@angular/core';
import { ClassType } from '@deepkit/core';

import { AppModule } from './module';
import { getModuleDef } from './utils';
import { raise } from '@ngkit/core';

const NG_KIT_DEF = 'ɵkit' as const;

interface NgKitDef {
  readonly appModule?: AppModule;
}

export function defineNgKitDef(type: any, def: NgKitDef): void {
  Object.defineProperty(type, NG_KIT_DEF, {
    configurable: false,
    get: () => def,
  });
}

export function getNgKitDef(type: any): NgKitDef | null {
  return type[NG_KIT_DEF] || null;
}

function convertNgModuleToAppModule<T>(type: ClassType<T>) {
  const ngModuleDef =
    getModuleDef<T>(type) ?? raise(`${type.name} is not a NgModule`);
  const ngKitDef = getNgKitDef(type);
  if (ngKitDef?.appModule) return ngKitDef.appModule;

  const ngImports =
    typeof ngModuleDef.imports === 'function'
      ? ngModuleDef.imports()
      : ngModuleDef.imports;

  const imports = ngImports.reduce(
    (imports, ngImport) => [...imports, convertNgModuleToAppModule(ngImport)],
    [] as AppModule[],
  );

  return new AppModule();
}
