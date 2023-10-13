import {
  ComponentFactoryResolver,
  EnvironmentInjector,
  NgModuleRef,
} from '@angular/core';
import { NgKitComponentFactoryResolver } from './component-factory-resolver';

export class NgKitModuleRef<T> extends NgModuleRef<T> {
  override instance: T;

  override readonly componentFactoryResolver: ComponentFactoryResolver =
    new NgKitComponentFactoryResolver(this);

  destroy(): void {}

  get injector(): EnvironmentInjector {
    return undefined;
  }

  onDestroy(callback: () => void): void {}
}

export function createNgModule() {}

export const createNgModuleRef = createNgModule;
