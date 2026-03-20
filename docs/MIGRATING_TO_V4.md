# Migrating To Bijou v4.0.0

This guide is for existing Bijou apps moving onto the `4.0.0` release line.

The short version:

- `@flyingrobots/bijou` is still the degradation-first toolkit for CLIs, prompts, logs, and composable terminal output.
- `@flyingrobots/bijou-tui` is the high-fidelity runtime for fullscreen and app-like terminal experiences.
- `@flyingrobots/bijou-tui-app` is the framed shell built on top of that runtime.
- `@flyingrobots/bijou-node` provides the Node adapters plus the worker runtime and native demo recorder.

## Upgrade Checklist

1. Upgrade all Bijou packages together to `4.0.0`.
2. Decide whether each part of your app is a core string-first flow or a V4 runtime flow.
3. Treat `Surface`-returning helpers as real render values, not implicit strings.
4. Keep the fullscreen runtime pure: `App.view` and framed pane renderers return `Surface` or `LayoutNode`, never raw strings.
5. Prefer the `*Surface` companion helpers for common runtime chrome, and cross string boundaries explicitly with `surfaceToString(..., ctx.style)` only when you truly need a string endpoint.
6. If you use nested TEA apps, prefer `initSubApp()` and `updateSubApp()` for lifecycle wiring, with `mount()` for rendering.
7. If you adopt BCSS, stay within the documented supported scope for the current release line.

## Package Roles In v4

### `@flyingrobots/bijou`

Use this for:

- prompts and forms
- CLI output and logs
- boxes, tables, trees, badges, alerts, progress bars
- themes, output-mode detection, and test adapters

`@flyingrobots/bijou` remains the stable, pure, degradation-first package. It contains both string-oriented and surface-oriented primitives. `4.0.0` does not require every core helper to return `Surface`.

### `@flyingrobots/bijou-tui`

Use this for:

- fullscreen TEA apps
- layout trees and surface composition
- motion, overlays, and shell-style interaction
- programmable pipeline features

The runtime now treats `ViewOutput` as the public render contract.

```ts
type ViewOutput = Surface | LayoutNode;
```

### `@flyingrobots/bijou-tui-app`

Use this when you want:

- framed shell chrome
- tabs, footer/help chrome, overlays, drawer/modal flows
- a batteries-included app skeleton

The shell accepts pane renderers that return `ViewOutput`, not just string blocks.

### `@flyingrobots/bijou-node`

Use this for:

- `createNodeContext()` / `initDefaultContext()`
- raw input, resize events, styling, file access
- `runInWorker()` / `startWorkerApp()`
- `recordDemoGif()` and related native recorder helpers

## The Biggest Behavioral Change: Pure Runtime Boundaries

Some runtime-first helpers now return `Surface`. The most visible example is `badge()`.

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

The same rule applies when you feed `badge()` or other surface output into:

- `console.log(...)`
- template strings
- `Array.join(...)`
- string-first helpers like `table()` cells

For common app-shell composition, prefer the surface-native companions instead of converting back to strings:

```ts
import { badge, separatorSurface, tableSurface } from '@flyingrobots/bijou';

const table = tableSurface({
  columns: [{ header: 'Service' }, { header: 'Status' }],
  rows: [['api', badge('LIVE', { variant: 'success', ctx })]],
  ctx,
});
```

The preferred surface-native companions are:

- `boxSurface()`
- `headerBoxSurface()`
- `separatorSurface()`
- `alertSurface()`
- `tableSurface()`
- `vstackSurface()`
- `hstackSurface()`

Transition-era aliases were removed from the runtime-facing API surface:

- use `boxSurface()`, not `boxV3()`
- use `vstackSurface()`, not `vstackV3()`
- use `hstackSurface()`, not `hstackV3()`

## `surfaceToString()` Now Needs A Style Port

In `4.0.0`, `surfaceToString()` requires a `StylePort`.

```ts
surfaceToString(surface, ctx.style);
```

If you previously called `surfaceToString(surface)` with one argument, update those call sites.

## `App.view` And Framed Pane Renderers

The runtime now documents the truth:

```ts
interface App<Model, Msg> {
  view(model: Model): Surface | LayoutNode;
}
```

Framed pane renderers follow the same rule. Return:

- `Surface` for direct rendering
- `LayoutNode` for layout-tree composition

If you still have string-returning runtime views, convert them explicitly before they cross the runtime boundary.

## Sub-Apps: Prefer Lifecycle Helpers

For nested TEA apps, the release-ready pattern is:

- `initSubApp()` for child startup
- `updateSubApp()` for child updates and command mapping
- `mount()` for rendering the child view into the parent
- `mapCmds()` when you need direct command mapping

`mount()` alone is not the full lifecycle story.

## BCSS Scope In `4.0.0`

BCSS is real in `4.0.0`, but intentionally scoped.

Supported:

- `Type`, `.class`, and `#id` selectors
- `var(token.path)` lookups
- `@media (width ...)` and `@media (height ...)`
- supported text-style properties on documented V3 surface components
- frame shell regions that expose BCSS identity

Not promised in `4.0.0`:

- a global CSS cascade across arbitrary layout nodes
- blanket styling of every component in the repository

If you need a good template, start from [`examples/v3-css`](../examples/v3-css/).

## Recommended Migration Flow

### 1. Upgrade dependencies together

```bash
npm install @flyingrobots/bijou@4.0.0 @flyingrobots/bijou-node@4.0.0
```

Add the runtime packages if the app uses them:

```bash
npm install @flyingrobots/bijou-tui@4.0.0 @flyingrobots/bijou-tui-app@4.0.0
```

### 2. Fix string/surface seams first

Look for:

- `console.log(badge(...))`
- `` `${badge(...)}` ``
- arrays of mixed strings and `Surface`
- string-only helper APIs receiving `Surface`

### 3. Update framed panes to `ViewOutput`

If your app uses `createFramedApp()`, return `Surface` or `LayoutNode` directly. Remove any string-returning pane shims.

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

## Canonical Runtime References

- Runtime starter: [`examples/v3-demo`](../examples/v3-demo/)
- BCSS: [`examples/v3-css`](../examples/v3-css/)
- Motion: [`examples/v3-motion`](../examples/v3-motion/)
- Sub-apps: [`examples/v3-subapp`](../examples/v3-subapp/)
- Workers: [`examples/v3-worker`](../examples/v3-worker/)
- Pipeline extension: [`examples/v3-pipeline`](../examples/v3-pipeline/)
