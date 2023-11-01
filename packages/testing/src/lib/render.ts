import {
  render as _render,
  RenderComponentOptions,
  RenderResult,
} from '@testing-library/angular';
import { Type } from '@angular/core';
// nx-ignore-next-line
import { setupRootComponent } from '@ngkit/core';

export async function render<T>(
  component: Type<T>,
  options?: RenderComponentOptions<T>,
): Promise<RenderResult<T>> {
  setupRootComponent(component);
  return await _render(component, options);
}
