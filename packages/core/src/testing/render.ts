import { Type } from '@angular/core';
import {
  render as _render,
  RenderComponentOptions,
  RenderResult,
} from '@testing-library/angular';

import { processRoutes, Routes } from '../lib/router';
import { setupRootComponent } from '../lib/injector';

export interface RenderOptions<T>
  extends Omit<RenderComponentOptions<T>, 'routes'> {
  readonly routes?: Routes;
}

export async function render<T>(
  component: Type<T>,
  options?: RenderOptions<T>,
): Promise<RenderResult<T>> {
  setupRootComponent(component);
  if (options?.routes) {
    processRoutes(options.routes);
  }
  return await _render(component, options as RenderComponentOptions<T>);
}
