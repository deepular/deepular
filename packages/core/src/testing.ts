import { render as ngRender, RenderComponentOptions, RenderResult } from '@testing-library/angular';
import { Type } from '@angular/core';
import { setupRootInjector } from './lib/injector';

export async function render<T>(component: Type<T>, options?: RenderComponentOptions<T>): Promise<RenderResult<T>> {
  setupRootInjector(component);
  return await ngRender(component, options);
}
