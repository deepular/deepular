import ts from 'typescript';
import { addImportIfMissing } from '../utils';

export const DECORATOR_IDENTIFIER_NAME = 'NgModule';

const PACKAGE_NAME = '@angular/core';

export class AddNgModuleDecoratorTransformer implements ts.CustomTransformer {
  constructor(private readonly context: ts.TransformationContext) {}

  transformBundle(node: ts.Bundle): ts.Bundle {
    return node;
  }

  transformSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
    let addNgModuleImport = false;

    const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
      if (ts.isClassDeclaration(node)) {
        if (
          node.heritageClauses?.some(clause => {
            return clause.types.some(type => {
              return type.expression.getText().startsWith('createModule');
            });
          })
        ) {
          addNgModuleImport = true;

          const ngModuleDecorator = this.context.factory.createDecorator(
            this.context.factory.createCallExpression(
              this.context.factory.createIdentifier(DECORATOR_IDENTIFIER_NAME),
              [],
              [this.context.factory.createObjectLiteralExpression()],
            ),
          );

          return this.context.factory.updateClassDeclaration(
            node,
            [ngModuleDecorator, ...(node.modifiers || [])],
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members,
          );
        }
      }

      return ts.visitEachChild(node, visitor, this.context);
    };

    sourceFile = ts.visitEachChild(sourceFile, visitor, this.context);

    if (addNgModuleImport) {
      sourceFile = addImportIfMissing(
        this.context,
        DECORATOR_IDENTIFIER_NAME,
        PACKAGE_NAME,
      )(sourceFile);
    }

    return sourceFile;
  }
}
