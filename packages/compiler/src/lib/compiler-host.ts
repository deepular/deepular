import ts from 'typescript';
import { NgCompilerHost } from '@angular/compiler-cli/src/ngtsc/core';

export class NgKitCompilerHost extends NgCompilerHost {
  static override wrap = NgCompilerHost.wrap;

  // override getSourceFile(
  //   fileName: string,
  //   languageVersion: ts.ScriptTarget,
  // ): ts.SourceFile | undefined {
  //   const text = this.readFile(fileName);
  //   if (!text) return undefined;
  //
  //   const sourceFile = ts.createSourceFile(
  //     fileName,
  //     text,
  //     languageVersion,
  //     true,
  //   );
  //
  //   const transformedSourceFile = transformSourceFile(sourceFile);
  //
  //   return ts.createSourceFile(
  //     sourceFile.fileName,
  //     ts.createPrinter().printFile(transformedSourceFile),
  //     ts.ScriptTarget.ES2022,
  //     true,
  //     ts.ScriptKind.TS,
  //   );
  // }
}
