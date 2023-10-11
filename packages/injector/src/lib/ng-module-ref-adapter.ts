import { ComponentFactoryResolver, NgModuleRef } from '@angular/core';

import { NgKitEnvironmentInjector } from './environment-injector';
import { NgKitComponentFactoryResolver } from './component-factory-resolver';
import { ProviderWithScope } from './module';

export class NgKitModuleRefAdapter extends NgModuleRef<null> {
  override readonly injector: NgKitEnvironmentInjector;
  override readonly componentFactoryResolver: NgKitComponentFactoryResolver =
    new NgKitComponentFactoryResolver(this);
  override readonly instance = null;

  constructor(config: {
    providers: ProviderWithScope,
    parent: NgKitEnvironmentInjector|null,
    debugName: string|null,
    runEnvironmentInitializers: boolean
  }) {
    super();
  }

  destroy(): void {
  }

  onDestroy(callback: () => void): void {
  }
}
