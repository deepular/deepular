import type { ClassType } from '@deepkit/core';
import type { CustomTransformer } from 'typescript';

import { InjectControllerTransformer } from './inject-controller-transformer.js';

export const customTransformers: readonly ClassType<CustomTransformer>[] = [
  InjectControllerTransformer,
];
