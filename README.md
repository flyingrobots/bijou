# Bijou

An industrial-grade TypeScript engine for terminal software. Use the pure primitives to build your own CLI, or drop into the batteries-included app shell for a full-screen TUI out of the box.

Bijou is designed for the mechanic who demands geometric lawfulness and the architect who needs a stable substrate. It scales from simple mode-aware prompts to high-fidelity, physics-powered terminal applications.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## Why Bijou?

Unlike Virtual-DOM wrappers that treat the terminal as a low-resolution browser, Bijou treats the terminal as a physical character grid.

- **Deterministic State**: The TEA loop ensures your UI is a pure function of your state history. No hooks, no side-effect soup, and no reconciliation drift.
- **Byte-Packed Performance**: Rendering happens on zero-allocation byte buffers (`Uint8Array`). It is designed for high-frequency updates and complex layouts that would choke string-heavy engines.
- **Geometric Honesty**: Portability is not an afterthought. Bijou adapts to CI logs, pipes, and screen readers by changing its rendering strategy, not just stripping colors.
- **Physics-Powered Motion**: Animations are driven by a unified heartbeat and spring physics, providing fluid movement that remains synchronized with the render loop.

## Essence

- **Degradation as a Substrate Property**: Write once; render perfectly in local TTYs, CI logs, pipes, and accessible environments.
- **The Elm Architecture (TEA)**: A deterministic state-update-view loop for industrial-strength interactive UIs.
- **Physics-Powered Motion**: Declarative spring and tween animations synchronized to a unified heartbeat.
- **Zero-Dependency Core**: The fundamental toolkit is pure TypeScript, isolated from platform-specific IO.

## Quick Start

### 1. Pure CLI Flow
Standalone primitives for prompts and structured output.

```ts
import { group, headerBox, input, select } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';

initDefaultContext();

const answers = await group({
  project: () => input({ title: 'Project name', required: true }),
  template: () => select({
    title: 'Template',
    options: [
      { label: 'TypeScript', value: 'ts' },
      { label: 'Go', value: 'go' },
    ],
  }),
});

console.log(headerBox('Scaffold', { detail: `${answers.project} (${answers.template})` }));
```

### 2. Interactive Runtime
Full-screen TEA loop with layout, overlays, and motion.

```ts
import { type App, quit, run, vstackSurface } from '@flyingrobots/bijou-tui';
import { badge, boxSurface } from '@flyingrobots/bijou';
import { initDefaultContext } from '@flyingrobots/bijou-node';

const ctx = initDefaultContext();

const app: App<{ count: number }> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (msg.type === 'key' && msg.key === 'q') return [model, [quit()]];
    if (msg.type === 'key' && msg.key === 'k') return [{ count: model.count + 1 }, []];
    return [model, []];
  },
  view: (model) => boxSurface(
    vstackSurface(
      `Count: ${model.count}`,
      badge(model.count > 10 ? 'HIGH' : 'LOW', { variant: 'info', ctx }),
    ),
    { title: 'Counter', padding: 1, ctx },
  ),
};

await run(app);
```

### 3. Scaffold a Framed App
Get the batteries-included workspace shell immediately.

```bash
npm create bijou-tui-app@latest my-app
```

## Packages

| Package | Role |
| :--- | :--- |
| [`@flyingrobots/bijou`](./packages/bijou/) | Core toolkit: prompts, components, themes, ports. |
| [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) | Interactive runtime: TEA, layout, motion, overlays. |
| [`@flyingrobots/bijou-node`](./packages/bijou-node/) | Node.js adapters: IO, styling, worker helpers. |
| [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) | Localization: in-memory runtime and catalogs. |

## Documentation

- **[DOGFOOD](./docs/DOGFOOD.md)**: The canonical documentation app. Run `npm run dogfood` to see Bijou in action.
- **[Design System](./docs/design-system/README.md)**: The foundations and component families.
- **[Architecture](./ARCHITECTURE.md)**: The hexagonal design and core properties.
- **[Advanced Guide](./ADVANCED_GUIDE.md)**: Deep dives into the pipeline, shaders, and motion.

---
Built with terminal ambition by [FLYING ROBOTS](https://github.com/flyingrobots)
)
ts)
