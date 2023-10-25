import type { ClassType } from '@deepkit/core';
import type { CustomTransformer } from 'typescript';

import { InjectControllerTransformer } from './inject-controller-transformer';

export const customTransformers: readonly ClassType<CustomTransformer>[] = [
  // InjectControllerTransformer,
] as const;
