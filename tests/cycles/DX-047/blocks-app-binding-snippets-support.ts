import { resolve } from 'node:path';
import ts from 'typescript';

export interface TextFrame {
  readonly width: number;
  readonly height: number;
  get(x: number, y: number): { readonly char?: string };
}

export function frameText(frame: TextFrame): string {
  let text = '';
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      text += frame.get(x, y).char ?? ' ';
    }
    text += '\n';
  }
  return text;
}

export function lastFrame(frames: readonly TextFrame[]): TextFrame {
  const frame = frames.at(-1);
  if (frame === undefined) {
    throw new Error('Missing rendered frame');
  }
  return frame;
}

export function typecheck(root: string, relativePath: string): readonly string[] {
  const rootFile = resolve(root, relativePath);
  const program = ts.createProgram([rootFile], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true,
    noImplicitOverride: true,
    noFallthroughCasesInSwitch: true,
    noImplicitReturns: true,
    noPropertyAccessFromIndexSignature: true,
    useUnknownInCatchVariables: true,
    isolatedModules: true,
    verbatimModuleSyntax: true,
    esModuleInterop: true,
    skipLibCheck: true,
    noEmit: true,
    baseUrl: root,
    paths: {
      '@flyingrobots/bijou': ['packages/bijou/src/index.ts'],
    },
  });

  return ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName === rootFile)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}
