import ts from 'typescript';

import { customTransformers } from './transformers/index.js';

export function transformSourceFile(
  sourceFile: ts.SourceFile,
  compilerOptions?: ts.CompilerOptions,
): ts.SourceFile {
  const result = ts.transform(
    sourceFile,
    customTransformers.map<ts.TransformerFactory<ts.SourceFile>>(
      Transformer => context => {
        const transformer = new Transformer(context);
        return node => transformer.transformSourceFile(node);
      },
      compilerOptions,
    ),
  );

  return result.transformed[0];
}
