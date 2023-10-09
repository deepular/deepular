import { NgtscProgram } from '@angular/compiler-cli';
import type { NgCompilerOptions } from '@angular/compiler-cli/src/ngtsc/core/api';
import type api from '@angular/compiler-cli/src/transformers/api';
import ts from 'typescript';

import { transformSourceFile } from './transform.js';

export class NgKitProgram extends NgtscProgram {
  constructor(
    rootNames: readonly string[],
    options: NgCompilerOptions,
    delegateHost: api.CompilerHost,
    oldProgram?: NgKitProgram,
  ) {
    super(rootNames, options, delegateHost, oldProgram);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // const tsProgram = (this as any).tsProgram as ts.Program;

    // const tsProgramGetSourceFiles = tsProgram.getSourceFiles;
    // tsProgram.getSourceFiles = () => {
    //   const sourceFiles = tsProgramGetSourceFiles().filter(v => !!v);
    //   return sourceFiles.map(sourceFile => this.transformSourceFile(sourceFile));
    // };

    // const tsProgramGetSourceFile = tsProgram.getSourceFile;
    // tsProgram.getSourceFile = (fileName: string) =>{
    //   const sourceFile = tsProgramGetSourceFile(fileName);
    //   return sourceFile ? this.transformSourceFile(sourceFile) : undefined;
    // }

    // const tsProgramGetSourceFileByPath = tsProgram.getSourceFileByPath;
    // tsProgram.getSourceFileByPath = (path: ts.Path) => {
    //   const sourceFile = tsProgramGetSourceFileByPath(path);
    //   return sourceFile ? this.transformSourceFile(sourceFile) : undefined;
    // }
  }

  private transformSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
    return transformSourceFile(
      sourceFile,
      this.getTsProgram().getCompilerOptions(),
    );
  }
}
