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
  const program = ts.createProgram([rootFile], testCompilerOptions(root));

  return ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName === rootFile)
    .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

function testCompilerOptions(root: string): ts.CompilerOptions {
  const configPath = resolve(root, 'tsconfig.tests.json');
  const configFile = ts.readConfigFile(configPath, (path) => ts.sys.readFile(path));
  if (configFile.error !== undefined) {
    throw new Error(formatDiagnostic(configFile.error));
  }
  const config: unknown = configFile.config;
  if (config === undefined) {
    throw new Error(`Missing TypeScript config content: ${configPath}`);
  }
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map(formatDiagnostic).join('\n'));
  }
  return {
    ...parsed.options,
    noEmit: true,
  };
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
}
