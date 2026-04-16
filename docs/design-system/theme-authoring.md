# Theme Authoring Guide

This guide explains how to write your own Bijou theme, how to choose the right
token family, and how to load a custom theme into a real app.

Use this together with:

- [Theme Token Vocabulary](./theme-tokens.md) for what each token family means
- [packages/bijou/src/core/theme/tokens.ts](../../packages/bijou/src/core/theme/tokens.ts)
  for the raw type contract
- [packages/bijou/src/core/theme/presets.ts](../../packages/bijou/src/core/theme/presets.ts)
  for concrete built-in examples

## What a Bijou theme contains

Every Bijou theme has these top-level groups:

- `name`
- `status`
- `semantic`
- `gradient`
- `border`
- `ui`
- `surface`

The built-in required keys inside those groups are:

- `status`: `success`, `error`, `warning`, `info`, `pending`, `active`, `muted`
- `semantic`: `success`, `error`, `warning`, `info`, `accent`, `muted`, `primary`
- `border`: `primary`, `secondary`, `success`, `warning`, `error`, `muted`
- `ui`: `cursor`, `scrollThumb`, `scrollTrack`, `sectionHeader`, `logo`, `tableHeader`, `trackEmpty`
- `surface`: `primary`, `secondary`, `elevated`, `overlay`, `muted`
- `gradient`: `brand`, `progress`

If a built-in key is missing in a DTCG JSON theme, Bijou will still load the
document, but that missing token resolves to a black/default placeholder. In
practice, that means an incomplete theme is considered malformed even if it
parses successfully.

## Choose tokens by job, not by color

Before picking colors, decide what each token is responsible for:

- `semantic.*` is for foreground meaning and emphasis
- `surface.*` is for fills, containment, elevation, and interruption level
- `border.*` is for structure and boundary emphasis
- `ui.*` is for reusable shell/runtime chrome
- `status.*` is for actual state labels and indicators
- `gradient.*` is for rare decorative or continuous-range emphasis

If you need the rulebook for those meanings, read
[Theme Token Vocabulary](./theme-tokens.md) first. This guide is about authoring
and loading; that guide is about semantics.

## Token value shape

A color token can be either:

- a simple foreground hex string, like `"#88c0d0"`
- or an object with:
  - `hex`
  - optional `bg`
  - optional `modifiers`

Supported modifiers are:

- `bold`
- `dim`
- `strikethrough`
- `inverse`
- `underline`
- `curly-underline`
- `dotted-underline`
- `dashed-underline`

Example token values:

```json
"primary": "#eceff4"
```

```json
"primary": {
  "hex": "#eceff4",
  "bg": "#2e3440",
  "modifiers": ["bold"]
}
```

## The shortest working custom theme

If you want a file you can start from immediately, this is the smallest honest
shape to copy and edit.

```json
{
  "name": { "$value": "my-theme" },
  "status": {
    "success": { "$type": "color", "$value": "#22c55e" },
    "error": { "$type": "color", "$value": "#ef4444" },
    "warning": { "$type": "color", "$value": "#f59e0b" },
    "info": { "$type": "color", "$value": "#38bdf8" },
    "pending": { "$type": "color", "$value": { "hex": "#64748b", "modifiers": ["dim"] } },
    "active": { "$type": "color", "$value": "#38bdf8" },
    "muted": { "$type": "color", "$value": { "hex": "#64748b", "modifiers": ["dim", "strikethrough"] } }
  },
  "semantic": {
    "success": { "$type": "color", "$value": "#22c55e" },
    "error": { "$type": "color", "$value": "#ef4444" },
    "warning": { "$type": "color", "$value": "#f59e0b" },
    "info": { "$type": "color", "$value": "#38bdf8" },
    "accent": { "$type": "color", "$value": "#c084fc" },
    "muted": { "$type": "color", "$value": { "hex": "#94a3b8", "modifiers": ["dim"] } },
    "primary": { "$type": "color", "$value": { "hex": "#f8fafc", "modifiers": ["bold"] } }
  },
  "border": {
    "primary": { "$type": "color", "$value": "#38bdf8" },
    "secondary": { "$type": "color", "$value": "#c084fc" },
    "success": { "$type": "color", "$value": "#22c55e" },
    "warning": { "$type": "color", "$value": "#f59e0b" },
    "error": { "$type": "color", "$value": "#ef4444" },
    "muted": { "$type": "color", "$value": "#64748b" }
  },
  "ui": {
    "cursor": { "$type": "color", "$value": "#38bdf8" },
    "scrollThumb": { "$type": "color", "$value": "#38bdf8" },
    "scrollTrack": { "$type": "color", "$value": "#334155" },
    "sectionHeader": { "$type": "color", "$value": { "hex": "#f8fafc", "modifiers": ["bold"] } },
    "logo": { "$type": "color", "$value": "#38bdf8" },
    "tableHeader": { "$type": "color", "$value": "#f8fafc" },
    "trackEmpty": { "$type": "color", "$value": "#1e293b" }
  },
  "surface": {
    "primary": { "$type": "color", "$value": { "hex": "#f8fafc", "bg": "#0f172a" } },
    "secondary": { "$type": "color", "$value": { "hex": "#e2e8f0", "bg": "#1e293b" } },
    "elevated": { "$type": "color", "$value": { "hex": "#f8fafc", "bg": "#334155" } },
    "overlay": { "$type": "color", "$value": { "hex": "#f8fafc", "bg": "#0f172a" } },
    "muted": { "$type": "color", "$value": { "hex": "#94a3b8", "bg": "#020617" } }
  },
  "gradient": {
    "brand": {
      "$type": "gradient",
      "$value": [
        { "pos": 0, "color": "#38bdf8" },
        { "pos": 1, "color": "#c084fc" }
      ]
    },
    "progress": {
      "$type": "gradient",
      "$value": [
        { "pos": 0, "color": "#22c55e" },
        { "pos": 1, "color": "#38bdf8" }
      ]
    }
  }
}
```

Save that as something like `themes/my-theme.json`.

## Loading a custom theme

For Node-hosted apps, the fastest path is `BIJOU_THEME`:

```bash
BIJOU_THEME=./themes/my-theme.json npm run dogfood
```

## Applying a theme programmatically

If you already have a `Theme` object in code, the easiest hosted path is:

```typescript
import { startApp } from '@flyingrobots/bijou-node';

await startApp(app, { theme: MY_THEME });
```

That one call creates the Node host context with your theme and uses it for the
run. If the app relies on ambient `ctx` resolution, that same themed context is
also registered as the default for the hosted run.

If you want explicit ownership of the context object first, use:

```typescript
import { createNodeContext } from '@flyingrobots/bijou-node';

const ctx = createNodeContext({ theme: MY_THEME });
await startApp(app, { ctx });
```

That same pattern works for any hosted app that goes through
`@flyingrobots/bijou-node` theme resolution.

If `BIJOU_THEME` points at a `.json` file, Bijou treats it as a DTCG document.
If it points at a known preset name, Bijou loads the preset instead.

Examples:

```bash
BIJOU_THEME=cyan-magenta npm run dogfood
BIJOU_THEME=teal-orange-pink npm run dogfood
BIJOU_THEME=./themes/my-theme.json npm run dogfood
```

## Authoring in TypeScript

If you own the app code and want to construct a theme in code instead of a JSON
file, match the `Theme` type directly:

```typescript
import type { Theme } from '@flyingrobots/bijou';

export const MY_THEME: Theme = {
  name: 'my-theme',
  status: {
    success: { hex: '#22c55e' },
    error: { hex: '#ef4444' },
    warning: { hex: '#f59e0b' },
    info: { hex: '#38bdf8' },
    pending: { hex: '#64748b', modifiers: ['dim'] },
    active: { hex: '#38bdf8' },
    muted: { hex: '#64748b', modifiers: ['dim', 'strikethrough'] },
  },
  semantic: {
    success: { hex: '#22c55e' },
    error: { hex: '#ef4444' },
    warning: { hex: '#f59e0b' },
    info: { hex: '#38bdf8' },
    accent: { hex: '#c084fc' },
    muted: { hex: '#94a3b8', modifiers: ['dim'] },
    primary: { hex: '#f8fafc', modifiers: ['bold'] },
  },
  border: {
    primary: { hex: '#38bdf8' },
    secondary: { hex: '#c084fc' },
    success: { hex: '#22c55e' },
    warning: { hex: '#f59e0b' },
    error: { hex: '#ef4444' },
    muted: { hex: '#64748b' },
  },
  ui: {
    cursor: { hex: '#38bdf8' },
    scrollThumb: { hex: '#38bdf8' },
    scrollTrack: { hex: '#334155' },
    sectionHeader: { hex: '#f8fafc', modifiers: ['bold'] },
    logo: { hex: '#38bdf8' },
    tableHeader: { hex: '#f8fafc' },
    trackEmpty: { hex: '#1e293b' },
  },
  surface: {
    primary: { hex: '#f8fafc', bg: '#0f172a' },
    secondary: { hex: '#e2e8f0', bg: '#1e293b' },
    elevated: { hex: '#f8fafc', bg: '#334155' },
    overlay: { hex: '#f8fafc', bg: '#0f172a' },
    muted: { hex: '#94a3b8', bg: '#020617' },
  },
  gradient: {
    brand: [
      { pos: 0, color: [56, 189, 248] },
      { pos: 1, color: [192, 132, 252] },
    ],
    progress: [
      { pos: 0, color: [34, 197, 94] },
      { pos: 1, color: [56, 189, 248] },
    ],
  },
};
```

## What you may extend

The public generic `Theme<S, U, G>` contract allows app-level extension of:

- `status`
- `ui`
- `gradient`

That means app code can add stable extra keys when the domain really needs them.

Good examples:

- extra `status` values for a real workflow state machine
- extra `ui` tokens for recurring shell chrome
- extra `gradient` keys for a stable branded effect

Bad examples:

- adding one-off ad hoc token keys because a single component needs a special case
- using `status.*` for focus or selection
- using `surface.*` as a generic text-emphasis bucket

## Practical authoring rules

- Start from a built-in preset and edit semantically, not from a blank page.
- Keep foreground/background contrast honest on every `surface.*` token.
- Test the theme in `interactive`, `static`, `pipe`, and `accessible` modes.
- Do not rely on color alone; labels and structure still need to make sense in
  `noColor`, `pipe`, and `accessible` lowering.
- If the theme adds recurring framework chrome, prefer extending `ui` instead
  of hard-coding raw colors in shell code.

## Where to look next

- [Theme Token Vocabulary](./theme-tokens.md)
- [packages/bijou/GUIDE.md](../../packages/bijou/GUIDE.md)
- [packages/bijou/ADVANCED_GUIDE.md](../../packages/bijou/ADVANCED_GUIDE.md)
- [packages/bijou-node/GUIDE.md](../../packages/bijou-node/GUIDE.md)
