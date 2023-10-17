import ts from 'typescript';

import { customTransformers } from './transformers';

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

export function addImportIfMissing(
  context: ts.TransformationContext,
  importName: string,
  packageName: string,
): ts.Transformer<ts.SourceFile> {
  const hasInjectImport = (node: ts.SourceFile) => {
    let found = false;
    ts.forEachChild(node, childNode => {
      if (ts.isImportDeclaration(childNode)) {
        const importText = childNode.moduleSpecifier.getText();
        if (importText.includes(packageName)) {
          const namedBindings = childNode.importClause?.namedBindings;
          if (namedBindings && ts.isNamedImports(namedBindings)) {
            namedBindings.elements.forEach(element => {
              if (element.name.getText() === importName) {
                found = true;
              }
            });
          }
        }
      }
    });
    return found;
  };

  const addInjectImport = (sourceFile: ts.SourceFile) => {
    const identifier = context.factory.createIdentifier(importName);

    const importInjectorClause = context.factory.createImportClause(
      false,
      undefined,
      context.factory.createNamedImports([
        context.factory.createImportSpecifier(false, identifier, identifier),
      ]),
    );

    const importInjector = context.factory.createImportDeclaration(
      undefined,
      importInjectorClause,
      context.factory.createStringLiteral(packageName),
    );

    const updatedStatements = [importInjector, ...sourceFile.statements];

    return context.factory.updateSourceFile(sourceFile, updatedStatements);
  };

  return sourceFile => {
    if (!hasInjectImport(sourceFile)) {
      return addInjectImport(sourceFile);
    }
    return sourceFile;
  };
}

export function getDecorator<
  N extends ts.Node & { readonly modifiers?: ts.NodeArray<ts.ModifierLike> },
>(node: N, name: string): ts.Decorator | undefined {
  return node.modifiers
    ?.filter((modifier): modifier is ts.Decorator => ts.isDecorator(modifier))
    .find(decorator => getDecoratorName(decorator) === name);
}

export function getDecoratorName(node: ts.Decorator): string | null {
  return ts.isCallExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression)
    ? node.expression.expression.text
    : null;
}

export function getPropertyName(property: ts.ObjectLiteralElementLike): string {
  if (!property.name || !ts.isIdentifier(property.name)) {
    throw new Error('Missing property name');
  }
  return property.name.text;
}

export function getProperty<E extends ts.ObjectLiteralExpression>(
  expression: E,
  name: string,
): ts.ObjectLiteralElementLike | undefined {
  return expression.properties.find(
    property => getPropertyName(property) === name,
  );
}

export function resolveVariableReference(
  typeChecker: ts.TypeChecker,
  node: ts.Identifier,
): ts.Type | null {
  const symbol = typeChecker.getSymbolAtLocation(node);
  if (symbol) {
    const valueDeclaration = symbol.valueDeclaration;
    if (valueDeclaration && ts.isVariableDeclaration(valueDeclaration)) {
      if (valueDeclaration.initializer) {
        return typeChecker.getTypeAtLocation(valueDeclaration.initializer);
      }
    }
  }
  return null;
}

export function getCurrentExportStatement(
  sourceFile: ts.SourceFile,
  className: string,
): ts.ExportDeclaration | undefined {
  let exportStatement: ts.ExportDeclaration | undefined;

  ts.forEachChild(sourceFile, (node: ts.Node) => {
    if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    ) {
      // Check if the export statement exports the specific class.
      const exportSymbol = node.exportClause.elements.find(
        element => element.name.getText() === className,
      );

      if (exportSymbol) {
        exportStatement = node;
      }
    }
  });

  return exportStatement;
}

export function nodeToSource(node: ts.Node, sourceFile: ts.SourceFile): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}
