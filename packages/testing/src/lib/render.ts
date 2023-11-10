import { Type } from '@angular/core';
import {
  render as _render,
  RenderComponentOptions,
  RenderResult,
} from '@testing-library/angular';
// nx-ignore-next-line
import { processRoutes, Routes, setupRootComponent } from '@ngkit/core';

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
