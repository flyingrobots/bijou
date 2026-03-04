# `filter()`

Fuzzy-filter select with vim-style normal/insert modes

![demo](demo.gif)

## Keyboard

| Mode | Key | Action |
|------|-----|--------|
| Normal | `j` / `↓` | Navigate down |
| Normal | `k` / `↑` | Navigate up |
| Normal | `/` | Enter insert mode |
| Normal | any other printable | Enter insert mode + type character |
| Normal | `Escape` | Cancel |
| Insert | any printable | Type filter character |
| Insert | `↑` / `↓` | Navigate |
| Insert | `Backspace` | Delete last character |
| Insert | `Escape` | Return to normal mode |
| Either | `Enter` | Select current item |
| Either | `Ctrl+C` | Cancel |

The mode indicator shows `:` in normal mode and `/` in insert mode.

## Run

```sh
npx tsx examples/filter/main.ts
```

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { filter, badge } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

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
  console.log('Selected:', badge(language.toUpperCase(), { variant: 'primary', ctx }));
}

main().catch(console.error);
```

[← Examples](../README.md)
