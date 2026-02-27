import { initDefaultContext } from '@flyingrobots/bijou-node';
import { filter, badge } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

async function main() {
  const language = await filter({
    title: 'Choose a programming language:',
    placeholder: 'Type to filter...',
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

  console.log();
  console.log('Selected:', badge(language.toUpperCase(), { variant: 'primary', ctx }));
}

main().catch(console.error);
