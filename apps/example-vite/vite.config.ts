/// <reference types="vitest" />
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import angular from '@analogjs/vite-plugin-angular';
import { deepkitType } from '@deepkit/vite';
import liveReload from 'rollup-plugin-livereload';
import { join } from 'node:path';
import * as ts from 'typescript';

function nodeToString(node: ts.Node, sourceFile: ts.SourceFile): string {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

const injectControllerTransformer: ts.CustomTransformerFactory = (context) => {
  class ControllerTransformer implements ts.CustomTransformer {
    constructor(private readonly context: ts.TransformationContext) {
    }

    transformBundle(node: ts.Bundle): ts.Bundle {
      return node;
    }

    transformSourceFile(node: ts.SourceFile): ts.SourceFile {
      const visitor = (node: ts.Node): any => {
        if (ts.isClassDeclaration(node)) {
          const updatedMembers = node.members.map(member => {
            if (!ts.isConstructorDeclaration(member)) return member;

            const updatedParameters = member.parameters.map(parameter => {
              if (!ts.isTypeReferenceNode(parameter.type)) return parameter;
              if (!ts.isIdentifier(parameter.type.typeName)) return parameter;
              if (parameter.type.typeName.escapedText !== 'ServerController') return parameter;

              const controllerType = parameter.type.typeArguments[0];
              if (!ts.isTypeReferenceNode(controllerType)) return parameter;
              if (!ts.isIdentifier(controllerType.typeName)) return parameter;
              const controllerText = controllerType.typeName.escapedText as string;

              const controllerNameNode = this.context.factory.createStringLiteral(controllerText);

              const injectDecorator = this.context.factory.createDecorator(this.context.factory.createCallExpression(this.context.factory.createIdentifier('Inject'), [], [controllerNameNode]));

              return this.context.factory.updateParameterDeclaration(parameter, [injectDecorator, ...parameter.modifiers], parameter.dotDotDotToken, parameter.name, parameter.questionToken, parameter.type, parameter.initializer);
            })

            return this.context.factory.updateConstructorDeclaration(
              member,
              member.modifiers,
              updatedParameters,
              member.body,
            );
          })

          return this.context.factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, updatedMembers)
        }
        return ts.visitEachChild(node, visitor, this.context);
      };

      return ts.visitEachChild(node, visitor, this.context);
    }
  }

  return new ControllerTransformer(context);
}

export default defineConfig(({ mode, ssrBuild }) => {
  return {
    publicDir: 'src/public',
    build: {
      modulePreload: false,
      minify: false,
      rollupOptions: {
        preserveEntrySignatures: 'strict',
        output: {
          esModule: true,
          format: 'esm',
          ...(mode === 'development'
            ? {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
              }
            : {}),
        },
        input: ssrBuild
          ? join(__dirname, 'src/main.server.ts')
          : join(__dirname, 'index.html'),
      },
    },
    resolve: {
      mainFields: ['module'],
    },
    plugins: [
      angular(),
      deepkitType(),
      nxViteTsPaths(),
      visualizer() as Plugin,
      !ssrBuild && splitVendorChunkPlugin(),
      !ssrBuild && liveReload({ delay: 500 }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test-setup.ts'],
      include: ['**/*.spec.ts'],
      cache: {
        dir: `../../node_modules/.cache/vitest`,
      },
    },
    define: {
      'import.meta.vitest': mode !== 'production',
      'import.meta.env.NX_WORKSPACE_ROOT': JSON.stringify(
        process.env.NX_WORKSPACE_ROOT!,
      ),
      'import.meta.env.NX_PROJECT_ROOT': JSON.stringify(
        join('apps', process.env.NX_TASK_TARGET_PROJECT!),
      ),
    },
  };
});
