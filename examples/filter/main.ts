import { initDefaultContext } from '@flyingrobots/bijou-node';
import { filter, badge, surfaceToString } from '@flyingrobots/bijou';

const ctx = initDefaultContext();
const badgeText = (label: string, variant: Parameters<typeof badge>[1]['variant']) =>
  surfaceToString(badge(label, { variant, ctx }), ctx.style);

async function main() {
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

  console.log();
  console.log('Selected:', badgeText(language.toUpperCase(), 'primary'));
}

main().catch(console.error);
