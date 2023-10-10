import { ClassType } from '@deepkit/core';
import {
  ClassDecoratorResult,
  createClassDecoratorContext,
} from '@deepkit/type';

import { Feature } from './feature';

export class FeatureDecorator {
  name: string;
  requires: Set<ClassType<Feature>>;
}

class FeatureDecoratorClass {
  t = new FeatureDecorator();

  config(name: string, requires: ClassType<Feature>[] = []) {
    this.t.name = name;
    this.t.requires = new Set(requires);
  }
}

export const feature: ClassDecoratorResult<typeof FeatureDecoratorClass> =
  createClassDecoratorContext(FeatureDecoratorClass);
