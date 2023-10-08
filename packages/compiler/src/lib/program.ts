import { NgtscProgram } from '@angular/compiler-cli';
import { NgCompilerOptions } from '@angular/compiler-cli/src/ngtsc/core/api';
import api from '@angular/compiler-cli/src/transformers/api';
import ts from 'typescript';
import { ClassType } from '@deepkit/core';

import { InjectControllerTransformer } from './transformers/index.js';

export class NgKitProgram extends NgtscProgram {
  private readonly customTransformers: readonly ClassType<ts.CustomTransformer>[] = [InjectControllerTransformer];

  constructor(rootNames: readonly string[], options: NgCompilerOptions, delegateHost: api.CompilerHost, oldProgram?: NgtscProgram) {
    super(rootNames, options, delegateHost, oldProgram);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tsProgram = (this as any).tsProgram as ts.Program;

    const tsProgramGetSourceFiles = tsProgram.getSourceFiles;
    tsProgram.getSourceFiles = () => {
      const sourceFiles = tsProgramGetSourceFiles().filter(v => !!v);
      return sourceFiles.map(sourceFile => this.transformSourceFile(sourceFile));
    };

    const tsProgramGetSourceFile = tsProgram.getSourceFile;
    tsProgram.getSourceFile = (fileName: string) =>{
      const sourceFile = tsProgramGetSourceFile(fileName);
      return sourceFile ? this.transformSourceFile(sourceFile) : undefined;
    }

    const tsProgramGetSourceFileByPath = tsProgram.getSourceFileByPath;
    tsProgram.getSourceFileByPath = (path: ts.Path) => {
      const sourceFile = tsProgramGetSourceFileByPath(path);
      return sourceFile ? this.transformSourceFile(sourceFile) : undefined;
    }
  }

  private transformSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
    const result = ts.transform(
      sourceFile,
      this.customTransformers.map<ts.TransformerFactory<ts.SourceFile>>(Transformer => (context) => {
          const transformer = new Transformer(context);
          return (node) => transformer.transformSourceFile(node);
        }),
      this.getTsProgram().getCompilerOptions(),
    );

    return result.transformed[0];

    // const newSourceFile = ts.createSourceFile(sourceFile.fileName, ts.createPrinter().printFile(result.transformed[0]), ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS);
    // return Object.assign(sourceFile, newSourceFile);
  }
}
