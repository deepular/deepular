import { ClassType } from '@deepkit/core';
import {
  ClassDecoratorResult,
  createClassDecoratorContext,
} from '@deepkit/type';

import { Feature } from './feature';

export class FeatureDecorator {
  name: string;
  requires: Set<ClassType<Feature<unknown>>>;
}

class FeatureDecoratorClass {
  t = new FeatureDecorator();

  config(name: string, options?: { requires?: ClassType<Feature<unknown>>[] }) {
    this.t.name = name;
    this.t.requires = new Set(options?.requires);
  }
}

export const feature: ClassDecoratorResult<typeof FeatureDecoratorClass> =
  createClassDecoratorContext(FeatureDecoratorClass);
