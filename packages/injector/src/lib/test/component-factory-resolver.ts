import { ComponentFactoryResolver, NgModuleRef, Type } from '@angular/core';

import { NgKitComponentFactory } from './component-factory';

export class NgKitComponentFactoryResolver extends ComponentFactoryResolver {
  constructor(private ngModule?: NgModuleRef<any>) {
    super();
  }

  override resolveComponentFactory<T>(
    component: Type<T>,
  ): NgKitComponentFactory<T> {
    return undefined;
  }
}
