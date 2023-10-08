import ts from 'typescript';

export const CONTROLLER_INTERFACE_NAMES = ['ServerController', 'SignalController'];

export class InjectControllerTransformer implements ts.CustomTransformer {
  private readonly nodeFactory: ts.NodeFactory;

  constructor(private readonly context: ts.TransformationContext) {
    this.nodeFactory = context?.factory || ts.factory;
  }

  transformBundle(node: ts.Bundle): ts.Bundle {
    return node;
  }

  transformSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
    if ((sourceFile as any).processedByInjectControllerTransformer) return sourceFile;

    // (sourceFile as any).processedByInjectControllerTransformer = true;

    // TODO: add named Inject import from '@angular/core'
    const visitor = (node: ts.Node): ts.ClassDeclaration | ts.Node => {
      if (ts.isClassDeclaration(node)) {
        const updatedMembers = node.members.map(member => {
          if (!ts.isConstructorDeclaration(member)) return member;

          const updatedParameters = member.parameters.map(parameter => {
            if (!parameter.type) return parameter;
            if (!ts.isTypeReferenceNode(parameter.type)) return parameter;
            if (!ts.isIdentifier(parameter.type.typeName)) return parameter;
            if (!parameter.type.typeName.escapedText || !CONTROLLER_INTERFACE_NAMES.includes(parameter.type.typeName.escapedText)) return parameter;

            const controllerType = parameter.type.typeArguments?.[0];
            if (!controllerType) return parameter;
            if (!ts.isTypeReferenceNode(controllerType)) return parameter;
            if (!ts.isIdentifier(controllerType.typeName)) return parameter;
            const controllerText = controllerType.typeName.escapedText as string;

            /*const hasExistingInjectControllerDecorator = parameter.modifiers?.filter((modifier): modifier is ts.Decorator => ts.isDecorator(modifier)).find(decorator =>(( decorator.expression as ts.CallExpression).expression as ts.Identifier).text === 'Inject');
            if (hasExistingInjectControllerDecorator) {
              return parameter;
            }*/

            const controllerNameNode = this.nodeFactory.createStringLiteral(controllerText);

            const injectDecorator = this.nodeFactory.createDecorator(this.nodeFactory.createCallExpression(this.nodeFactory.createIdentifier('Inject'), [], [controllerNameNode]));

            const modifiers = parameter.modifiers || [];

            return this.nodeFactory.updateParameterDeclaration(parameter, [injectDecorator, ...modifiers], parameter.dotDotDotToken, parameter.name, parameter.questionToken, parameter.type, parameter.initializer);
          })

          return this.nodeFactory.updateConstructorDeclaration(
            member,
            member.modifiers,
            updatedParameters,
            member.body,
          );
        });

        // Object.assign(classDeclaration, { getSourceFile: () => node.getSourceFile(), parent: node.parent });

        return this.nodeFactory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, updatedMembers)
      }

      return ts.visitEachChild(node, visitor, this.context);
    };

    return ts.visitEachChild(sourceFile, visitor, this.context);
  }
}

export const injectControllerTransformer: ts.CustomTransformerFactory = (context) => new InjectControllerTransformer(context);
