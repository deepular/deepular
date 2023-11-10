import { NgKitProgram } from './lib/program';
import { NgKitCompilerHost } from './lib/compiler-host';

export {
  NgKitProgram,
  NgKitCompilerHost,
  NgKitProgram as NgtscProgram,
  NgKitCompilerHost as NgCompilerHost,
};

export {
  readConfiguration,
  constructorParametersDownlevelTransform,
} from '@angular/compiler-cli';
