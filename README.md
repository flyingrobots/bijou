# Bijou

TypeScript toolkit for building terminal interfaces that remain usable across local TTYs, CI logs, piped output, and accessibility-focused runs.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## Why Bijou

- **Graceful degradation built in**: one codebase adapts automatically to TTY, CI, pipe, and accessible modes.
- **Zero-dependency core**: `@flyingrobots/bijou` is pure TypeScript and platform-agnostic (Ports and Adapters).
- **High-fidelity runtime**: `@flyingrobots/bijou-tui` adds TEA architecture, flex layout, keymaps, overlays, and physics-based animation.
- **Testable without terminal mocking**: use the test adapter to assert rendered strings directly.

## Packages

| Package | Purpose | Link |
| :--- | :--- | :--- |
| `@flyingrobots/bijou` | Core components, forms, themes, and environment detection | [`packages/bijou`](./packages/bijou/) |
| `@flyingrobots/bijou-node` | Node.js adapter for runtime, IO, and styling ports | [`packages/bijou-node`](./packages/bijou-node/) |
| `@flyingrobots/bijou-tui` | Interactive TEA runtime with layout, event bus, and animation | [`packages/bijou-tui`](./packages/bijou-tui/) |

All packages are versioned in lock-step.

## Install

Core components + Node runtime adapter:

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

Full interactive runtime (includes TEA engine):

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node @flyingrobots/bijou-tui
```

## Quick Start (Core Components)

```ts
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { group, input, select, headerBox } from '@flyingrobots/bijou';

initDefaultContext();

const answers = await group({
  project: () => input({ title: 'Project name', required: true }),
  template: () =>
    select({
      title: 'Template',
      options: [
        { label: 'TypeScript', value: 'ts' },
        { label: 'Go', value: 'go' },
      ],
    }),
});

console.log(
  headerBox('Scaffold', {
    detail: `${answers.project} (${answers.template})`,
  }),
);
```

## Quick Start (Interactive TUI Runtime)

```ts
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { run, quit, type App } from '@flyingrobots/bijou-tui';

initDefaultContext();

type Model = { count: number };

const app: App<Model> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (msg.type === 'key') {
      if (msg.key === 'q') return [model, [quit()]];
      if (msg.key === '+' || msg.key === 'k') return [{ count: model.count + 1 }, []];
      if (msg.key === '-' || msg.key === 'j') return [{ count: model.count - 1 }, []];
    }
    return [model, []];
  },
  view: (model) => `Count: ${model.count}\n\n+/- or j/k to change, q to quit`,
};

await run(app);
```

## Output Modes (Automatic)

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| `interactive` | TTY stdout | Full color, unicode, animations, interactive input |
| `static` | `CI` is set (and stdout is TTY) | Single-frame rendering, no animation loop |
| `pipe` | Non-TTY stdout, `NO_COLOR`, or `TERM=dumb` | Plain-text-safe output without ANSI styling |
| `accessible` | `BIJOU_ACCESSIBLE=1` | Screen-reader-friendly linear prompts |

## Try This Repository

```bash
git clone https://github.com/flyingrobots/bijou
cd bijou
npm install

# Component showcase
npx tsx demo.ts

# Full-screen runtime showcase
npx tsx demo-tui.ts

# Run any individual example
npx tsx examples/<name>/main.ts
```

There are 60+ curated examples in [`examples/`](./examples/) with per-example READMEs and demo tapes.

## Local Development

```bash
npm run build        # TypeScript project references build
npm run build:watch  # Incremental watch mode
npm test             # Vitest suite
npm run lint         # Typecheck each workspace package
npm run clean        # Remove build outputs
```

Node.js version: `>=18`.

## Documentation Map

- Project architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- Changelog: [`docs/CHANGELOG.md`](./docs/CHANGELOG.md)
- Example catalog: [`docs/EXAMPLES.md`](./docs/EXAMPLES.md)
- Package guides:
  - [`packages/bijou/GUIDE.md`](./packages/bijou/GUIDE.md)
  - [`packages/bijou-node/GUIDE.md`](./packages/bijou-node/GUIDE.md)
  - [`packages/bijou-tui/GUIDE.md`](./packages/bijou-tui/GUIDE.md)

## Latest Release Highlights (v1.2.0, March 4, 2026)

- Vim-style normal/insert mode interaction for `filter()`.
- Large component refactors (`dag`, `markdown`, `textarea`, `filter`) into smaller focused modules.
- Broad bug-fix sweep across forms, markdown rendering, and DAG layout/edge handling.

Full details: [`docs/CHANGELOG.md`](./docs/CHANGELOG.md#120--2026-03-04)

## License

MIT ([`LICENSE`](./LICENSE))
