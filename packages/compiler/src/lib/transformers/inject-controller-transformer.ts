import ts from 'typescript';

import { addImportIfMissing } from '../utils.js';

export const CONTROLLER_TYPE_NAMES = ['ServerController', 'SignalController'];

export const DECORATOR_IDENTIFIER_NAME = 'Inject';

const PACKAGE_NAME = '@angular/core';

export class InjectControllerTransformer implements ts.CustomTransformer {
  constructor(private readonly context: ts.TransformationContext) {}

  transformBundle(node: ts.Bundle): ts.Bundle {
    return node;
  }

  transformSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
    // TODO: add named Inject import from '@angular/core'

    let shouldInjectController: boolean = false;

    const visitor = (node: ts.Node): ts.ClassDeclaration | ts.Node => {
      if (ts.isClassDeclaration(node)) {
        const updatedMembers = node.members.map(member => {
          if (!ts.isConstructorDeclaration(member)) return member;

          const updatedParameters = member.parameters.map(parameter => {
            if (!parameter.type) return parameter;
            if (!ts.isTypeReferenceNode(parameter.type)) return parameter;
            if (!ts.isIdentifier(parameter.type.typeName)) return parameter;
            if (
              !parameter.type.typeName.escapedText ||
              !CONTROLLER_TYPE_NAMES.includes(
                parameter.type.typeName.escapedText,
              )
            )
              return parameter;

            const controllerType = parameter.type.typeArguments?.[0];
            if (!controllerType) return parameter;
            if (!ts.isTypeReferenceNode(controllerType)) return parameter;
            if (!ts.isIdentifier(controllerType.typeName)) return parameter;
            const controllerText = controllerType.typeName
              .escapedText as string;

            shouldInjectController = true;

            const hasExistingInjectControllerDecorator = parameter.modifiers
              ?.filter((modifier): modifier is ts.Decorator =>
                ts.isDecorator(modifier),
              )
              .find(
                decorator =>
                  (
                    (decorator.expression as ts.CallExpression)
                      .expression as ts.Identifier
                  ).text === DECORATOR_IDENTIFIER_NAME,
              );
            if (hasExistingInjectControllerDecorator) {
              return parameter;
            }

            const controllerNameNode =
              this.context.factory.createStringLiteral(controllerText);

            const injectDecorator = this.context.factory.createDecorator(
              this.context.factory.createCallExpression(
                this.context.factory.createIdentifier(
                  DECORATOR_IDENTIFIER_NAME,
                ),
                [],
                [controllerNameNode],
              ),
            );

            const modifiers = parameter.modifiers || [];

            return this.context.factory.updateParameterDeclaration(
              parameter,
              [injectDecorator, ...modifiers],
              parameter.dotDotDotToken,
              parameter.name,
              parameter.questionToken,
              parameter.type,
              parameter.initializer,
            );
          });

          return this.context.factory.updateConstructorDeclaration(
            member,
            member.modifiers,
            updatedParameters,
            member.body,
          );
        });

        return this.context.factory.updateClassDeclaration(
          node,
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses,
          updatedMembers,
        );
      }

      return ts.visitEachChild(node, visitor, this.context);
    };

    let newSourceFile = ts.visitEachChild(sourceFile, visitor, this.context);
    if (shouldInjectController) {
      newSourceFile = addImportIfMissing(
        this.context,
        DECORATOR_IDENTIFIER_NAME,
        PACKAGE_NAME,
      )(newSourceFile);
    }
    return newSourceFile;
  }
}
