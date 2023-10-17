import ts from 'typescript';
import {
  getDecorator,
  getProperty,
  getPropertyName,
  nodeToSource,
} from '../utils';

export const DECORATOR_IDENTIFIER_NAME = 'Component';

const COMPONENT_IMPORTS_PROPERTY_NAME = 'imports';

export class RemoveAppModuleFromComponentImportsTransformer
  implements ts.CustomTransformer
{
  constructor(private readonly context: ts.TransformationContext) {}

  transformBundle(node: ts.Bundle): ts.Bundle {
    return node;
  }

  transformSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
    const visitor = (node: ts.Node): ts.Node => {
      if (ts.isClassDeclaration(node)) {
        const componentDecorator = getDecorator(
          node,
          DECORATOR_IDENTIFIER_NAME,
        );

        if (componentDecorator) {
          if (ts.isCallExpression(componentDecorator.expression)) {
            if (
              ts.isObjectLiteralExpression(
                componentDecorator.expression.arguments[0],
              )
            ) {
              const importsProperty = getProperty(
                componentDecorator.expression.arguments[0],
                COMPONENT_IMPORTS_PROPERTY_NAME,
              );
              if (
                importsProperty &&
                ts.isPropertyAssignment(importsProperty) &&
                ts.isArrayLiteralExpression(importsProperty.initializer)
              ) {
                const instantiatedAppNodules =
                  importsProperty.initializer.elements
                    .filter(el => ts.isNewExpression(el))
                    .map(el => el.getText());

                const importsWithoutAppModules =
                  importsProperty.initializer.elements.filter(
                    el => !ts.isNewExpression(el),
                  );

                if (instantiatedAppNodules.length) {
                  const updatedPropertyAssignment =
                    this.context.factory.updatePropertyAssignment(
                      importsProperty,
                      importsProperty.name,
                      this.context.factory.updateArrayLiteralExpression(
                        importsProperty.initializer,
                        importsWithoutAppModules,
                      ),
                    );

                  const properties =
                    componentDecorator.expression.arguments[0].properties.map(
                      property =>
                        getPropertyName(property) ===
                        COMPONENT_IMPORTS_PROPERTY_NAME
                          ? updatedPropertyAssignment
                          : property,
                    );

                  const componentDecoratorExpression =
                    this.context.factory.updateCallExpression(
                      componentDecorator.expression,
                      componentDecorator.expression.expression,
                      [],
                      [
                        this.context.factory.updateObjectLiteralExpression(
                          componentDecorator.expression.arguments[0],
                          properties,
                        ),
                      ],
                    );

                  const newComponentDecorator =
                    this.context.factory.updateDecorator(
                      componentDecorator,
                      componentDecoratorExpression,
                    );

                  // FIXME: export statement is somehow missing
                  return this.context.factory.updateClassDeclaration(
                    node,
                    [newComponentDecorator],
                    node.name,
                    node.typeParameters,
                    node.heritageClauses,
                    node.members,
                  );
                }
              }
            }
          }
        }
      }

      return ts.visitEachChild(node, visitor, this.context);
    };

    return ts.visitEachChild(sourceFile, visitor, this.context);
  }
}
