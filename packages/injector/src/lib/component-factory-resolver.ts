import {
  ComponentFactory,
  ComponentFactoryResolver,
  NgModuleRef,
  Type,
  ɵget,
} from '@angular/core';

import { NgKitComponentFactory } from './component-factory';
import { getComponentDef } from './utils';

export class NgKitComponentFactoryResolver extends ComponentFactoryResolver {
  constructor(private ngModule?: NgModuleRef<any>) {
    super();
  }

  override resolveComponentFactory<T>(
    component: Type<T>,
  ): NgKitComponentFactory<T> {
    // ngDevMode && assertComponentType(component);
    const componentDef = getComponentDef(component)!;
    return new ComponentFactory(componentDef, this.ngModule);
  }
}
