import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { type BijouContext, filter } from '@flyingrobots/bijou';

type ExampleWriter = (line?: string) => void;

function consoleWriter(line = ''): void {
  console.log(line);
}

export async function main(
  ctx: BijouContext = initDefaultContext(),
  writeLine: ExampleWriter = consoleWriter,
): Promise<void> {
  const language = await filter({
    title: 'Choose a programming language:',
    placeholder: 'j/k navigate, type or / to search',
    options: [
      { label: 'TypeScript', value: 'ts', keywords: ['javascript', 'typed', 'web'] },
      { label: 'Rust', value: 'rust', keywords: ['systems', 'memory', 'safe'] },
      { label: 'Python', value: 'python', keywords: ['scripting', 'ml', 'data'] },
      { label: 'Go', value: 'go', keywords: ['google', 'concurrent', 'fast'] },
      { label: 'Zig', value: 'zig', keywords: ['systems', 'comptime', 'safe'] },
      { label: 'Elixir', value: 'elixir', keywords: ['erlang', 'functional', 'beam'] },
      { label: 'Haskell', value: 'haskell', keywords: ['functional', 'pure', 'lazy'] },
      { label: 'OCaml', value: 'ocaml', keywords: ['functional', 'ml', 'typed'] },
    ],
    ctx,
  });

  writeLine();
  writeLine(`Selected language: ${language.toUpperCase()}`);
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(console.error);
}
