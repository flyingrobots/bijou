# Bijou

An industrial-grade TypeScript engine for terminal software. Use the pure primitives to build your own CLI, or drop into the batteries-included app shell for a full-screen TUI out of the box.

Bijou is designed for the mechanic who demands geometric lawfulness and the architect who needs a stable substrate. It scales from simple mode-aware prompts to high-fidelity, physics-powered terminal applications.

[![npm version](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou)
[![License](https://img.shields.io/github/license/flyingrobots/bijou)](./LICENSE)

![Bijou demo](https://github.com/user-attachments/assets/8117f6ad-41e0-470f-aeb6-6722ec44fa2c)

## What's New in v4.4.1

Bijou `v4.4.1` is a framed-shell polish release focused on the `4.4.0`
regression fallout.

- `createFramedApp()` now preserves shell and pane background fill more
  honestly, including stock header/footer chrome.
- framed apps can opt into stock shell theme cycling through
  `shellThemes`, and DOGFOOD now proves that shared path end to end.
- the stock quit confirm accepts uppercase `Y` / `N` as well as lowercase
  input.

Read the short-form [changelog](./docs/CHANGELOG.md), the long-form
[What's New guide](./docs/releases/4.4.1/whats-new.md), and the
[migration guide](./docs/releases/4.4.1/migration-guide.md).

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

## Choose Your Lane

- **CLI or script**: start with [`@flyingrobots/bijou`](./packages/bijou/) and host it through [`@flyingrobots/bijou-node`](./packages/bijou-node/).
- **Interactive TUI**: start with [`@flyingrobots/bijou-tui`](./packages/bijou-tui/) and the hosted Node entrypoint in [`@flyingrobots/bijou-node`](./packages/bijou-node/).
- **Batteries-included app shell**: scaffold with [`create-bijou-tui-app`](./packages/create-bijou-tui-app/) or study [`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/).
- **MCP server**: use [`@flyingrobots/bijou-mcp`](./packages/bijou-mcp/) and the reference docs in [`docs/MCP.md`](./docs/MCP.md).
- **Localization**: start with [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) plus the catalog tooling packages.
- **Guided walkthroughs and proof**: use [`GUIDE.md`](./GUIDE.md) and run [`npm run dogfood`](./docs/DOGFOOD.md).

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
import { stringToSurface } from '@flyingrobots/bijou';
import { startApp } from '@flyingrobots/bijou-node';
import { isKeyMsg, quit, type App } from '@flyingrobots/bijou-tui';

const app: App<{ count: number }> = {
  init: () => [{ count: 0 }, []],
  update: (msg, model) => {
    if (isKeyMsg(msg) && msg.key === 'q') return [model, [quit()]];
    if (isKeyMsg(msg) && msg.key === 'k') return [{ count: model.count + 1 }, []];
    return [model, []];
  },
  view: (model) => stringToSurface(`Count: ${model.count}\nPress k to increment\nPress q to quit`, 20, 3),
};

await startApp(app);
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
| [`@flyingrobots/bijou-tui-app`](./packages/bijou-tui-app/) | Batteries-included framed shell and higher-level app composition. |
| [`create-bijou-tui-app`](./packages/create-bijou-tui-app/) | Project scaffolder for a hosted framed TUI app. |
| [`@flyingrobots/bijou-mcp`](./packages/bijou-mcp/) | MCP server package for exposing Bijou-backed tooling. |
| [`@flyingrobots/bijou-i18n`](./packages/bijou-i18n/) | Localization runtime: catalogs, formatting, and translation lookup. |
| [`@flyingrobots/bijou-i18n-tools`](./packages/bijou-i18n-tools/) | Catalog tooling primitives and workflow helpers. |
| [`@flyingrobots/bijou-i18n-tools-node`](./packages/bijou-i18n-tools-node/) | Node-hosted localization tooling helpers. |
| [`@flyingrobots/bijou-i18n-tools-xlsx`](./packages/bijou-i18n-tools-xlsx/) | Spreadsheet import/export adapters for localization workflows. |

## Documentation

- **[Guide](./GUIDE.md)**: Orientation, the fast path, and monorepo orchestration.
- **[Advanced Guide](./ADVANCED_GUIDE.md)**: Deep dives into the pipeline, shaders, and motion.
- **[DOGFOOD](./docs/DOGFOOD.md)**: The canonical documentation app. Run `npm run dogfood` to see Bijou in action.
- **[Design System](./docs/design-system/README.md)**: The foundations and component families.
- **[Architecture](./ARCHITECTURE.md)**: The hexagonal design and core properties.

## DOGFOOD

DOGFOOD is the canonical human-facing docs surface for Bijou.

If you are learning the framework, start there first. The `examples/` tree is
secondary/internal reference material, not the main public docs path.

---
Built with terminal ambition by [FLYING ROBOTS](https://github.com/flyingrobots)
