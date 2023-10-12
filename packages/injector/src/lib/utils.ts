import {
  ɵComponentDef,
  ɵNgModuleDef,
  ɵNG_MOD_DEF,
  ɵNG_COMP_DEF,
} from '@angular/core';

export function getComponentDef<T>(type: any): ɵComponentDef<T> | null {
  return type[ɵNG_COMP_DEF] || null;
}

export function getModuleDef<T>(type: any): ɵNgModuleDef<T> | null {
  return type[ɵNG_MOD_DEF] || null;
}
