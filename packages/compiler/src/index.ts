import { NgKitProgram } from './lib/program';
import { NgKitCompilerHost } from './lib/compiler-host';
import { InjectControllerTransformer } from './lib/transformers/inject-controller-transformer';

export {
  NgKitProgram,
  NgKitCompilerHost,
  InjectControllerTransformer,
  NgKitProgram as NgtscProgram,
  NgKitCompilerHost as NgCompilerHost,
};

export {
  readConfiguration,
  constructorParametersDownlevelTransform,
} from '@angular/compiler-cli';
