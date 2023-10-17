import type { ClassType } from '@deepkit/core';
import type { CustomTransformer } from 'typescript';

import { InjectControllerTransformer } from './inject-controller-transformer';
import { AddNgModuleDecoratorTransformer } from './add-ng-module-decorator-transformer';
import { RemoveAppModuleFromComponentImportsTransformer } from './remove-app-module-from-component-imports-transformer';

export const customTransformers: readonly ClassType<CustomTransformer>[] = [
  InjectControllerTransformer,
  AddNgModuleDecoratorTransformer,
  RemoveAppModuleFromComponentImportsTransformer,
] as const;
