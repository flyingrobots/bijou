# Migrating To Bijou v3.0.0

This guide is for existing Bijou apps moving onto the `3.0.0` release line.

The short version:

- `@flyingrobots/bijou` is still the degradation-first toolkit for CLIs, prompts, logs, and composable terminal output.
- `@flyingrobots/bijou-tui` is the high-fidelity runtime for fullscreen and app-like terminal experiences.
- `@flyingrobots/bijou-tui-app` is the framed shell built on top of that runtime.
- `@flyingrobots/bijou-node` provides the Node adapters plus the worker runtime and native demo recorder.

## Upgrade Checklist

1. Upgrade all Bijou packages together to `3.0.0`.
2. Decide whether each part of your app is a core string-first flow or a V3 runtime flow.
3. Treat `Surface`-returning helpers as real render values, not implicit strings.
4. Cross string boundaries explicitly with `surfaceToString(..., ctx.style)` when you feed V3 output into legacy string-only helpers.
5. If you use framed apps, update pane renderers to the new `ViewOutput` contract.
6. If you use nested TEA apps, prefer `initSubApp()` and `updateSubApp()` for lifecycle wiring, with `mount()` for rendering.
7. If you adopt BCSS, stay within the documented supported scope for `3.0.0`.

## Package Roles In v3

### `@flyingrobots/bijou`

Use this for:

- prompts and forms
- CLI output and logs
- boxes, tables, trees, badges, alerts, progress bars
- themes, output-mode detection, and test adapters

`@flyingrobots/bijou` remains the stable, pure, degradation-first package. It contains both string-oriented and surface-oriented primitives. `3.0.0` does not require every core helper to return `Surface`.

### `@flyingrobots/bijou-tui`

Use this for:

- fullscreen TEA apps
- layout trees and surface composition
- motion, overlays, and shell-style interaction
- programmable pipeline features

The runtime now treats `ViewOutput` as the public render contract.

```ts
type ViewOutput = string | Surface | LayoutNode;
```

### `@flyingrobots/bijou-tui-app`

Use this when you want:

- framed shell chrome
- tabs, footer/help chrome, overlays, drawer/modal flows
- a batteries-included app skeleton

The shell accepts pane renderers that return `ViewOutput`, not just strings.

### `@flyingrobots/bijou-node`

Use this for:

- `createNodeContext()` / `initDefaultContext()`
- raw input, resize events, styling, file access
- `runInWorker()` / `startWorkerApp()`
- `recordDemoGif()` and related native recorder helpers

## The Biggest Behavioral Change: Surface/String Boundaries

Some V3-first helpers now return `Surface`. The most visible example is `badge()`.

That means this old pattern is no longer safe everywhere:

```ts
console.log(badge('OK'));
```

If the surrounding API expects a string, convert explicitly:

```ts
import { badge, surfaceToString } from '@flyingrobots/bijou';

const ctx = initDefaultContext();
const text = surfaceToString(badge('OK', { ctx }), ctx.style);
console.log(text);
```

The same rule applies when you feed badge or other V3 surface output into:

- `console.log(...)`
- template strings
- `Array.join(...)`
- legacy string-only helpers like `table()` cells

## `surfaceToString()` Now Needs A Style Port

In `3.0.0`, `surfaceToString()` requires a `StylePort`.

```ts
surfaceToString(surface, ctx.style);
```

If you previously called `surfaceToString(surface)` with one argument, update those call sites.

## `App.view` And Framed Pane Renderers

The runtime now documents the truth:

```ts
interface App<Model, Msg> {
  view(model: Model): string | Surface | LayoutNode;
}
```

Framed pane renderers follow the same rule. You can return:

- `string` for legacy compatibility
- `Surface` for direct V3 rendering
- `LayoutNode` for layout-tree composition

If you keep returning strings, that still works. It is simply the legacy compatibility path now.

## Sub-Apps: Prefer Lifecycle Helpers

For nested TEA apps, the release-ready pattern is:

- `initSubApp()` for child startup
- `updateSubApp()` for child updates and command mapping
- `mount()` for rendering the child view into the parent
- `mapCmds()` when you need direct command mapping

`mount()` alone is not the full lifecycle story.

## BCSS Scope In `3.0.0`

BCSS is real in `3.0.0`, but intentionally scoped.

Supported:

- `Type`, `.class`, and `#id` selectors
- `var(token.path)` lookups
- `@media (width ...)` and `@media (height ...)`
- supported text-style properties on documented V3 surface components
- frame shell regions that expose BCSS identity

Not promised in `3.0.0`:

- a global CSS cascade across arbitrary layout nodes
- blanket styling of every component in the repository

If you need a good template, start from [`examples/v3-css`](../examples/v3-css/).

## Recommended Migration Flow

### 1. Upgrade dependencies together

```bash
npm install @flyingrobots/bijou@3.0.0 @flyingrobots/bijou-node@3.0.0
```

Add the runtime packages if the app uses them:

```bash
npm install @flyingrobots/bijou-tui@3.0.0 @flyingrobots/bijou-tui-app@3.0.0
```

### 2. Fix string/surface seams first

Look for:

- `console.log(badge(...))`
- `` `${badge(...)}` ``
- arrays of mixed strings and `Surface`
- string-only helper APIs receiving `Surface`

### 3. Update framed panes to `ViewOutput`

If your app uses `createFramedApp()`, return `Surface` or `LayoutNode` directly where that makes sense. Keep strings only where the pane is intentionally string-based.

### 4. Update nested app wiring

If you built manual child `init/update` plumbing, consider moving to `initSubApp()` and `updateSubApp()`.

### 5. Add smoke coverage

At minimum, run:

```bash
npm run build
npm test
npm run typecheck:test
npm run smoke:examples:all
```

## Canonical v3 References

- Runtime starter: [`examples/v3-demo`](../examples/v3-demo/)
- BCSS: [`examples/v3-css`](../examples/v3-css/)
- Motion: [`examples/v3-motion`](../examples/v3-motion/)
- Sub-apps: [`examples/v3-subapp`](../examples/v3-subapp/)
- Workers: [`examples/v3-worker`](../examples/v3-worker/)
- Pipeline extension: [`examples/v3-pipeline`](../examples/v3-pipeline/)
