# Guide — @flyingrobots/bijou

This guide covers the productive-fast path for the core package.

For render-path doctrine, byte-packed surface expectations, token-graph work, custom mode-aware components, and the deeper component-family lanes, use [ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md).

## Setup

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox, table, badge } from '@flyingrobots/bijou';

initDefaultContext();
```

`initDefaultContext()` auto-detects your environment (TTY, CI, pipe, NO_COLOR) and sets the global context. All components use it automatically.

## Output Modes

Every component checks `ctx.mode` and adapts its rendering:

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| **`interactive`** | TTY detected | Full RGB colors, Unicode borders, animations. |
| **`static`** | `CI=true` | Single-frame rendering; no animations. |
| **`pipe`** | Piped stdout or `TERM=dumb` | Plain text, ASCII-only fallback. |
| **`accessible`** | `BIJOU_ACCESSIBLE=1` | Linearized, screen-reader-friendly output. |

## Components: String vs. Surface

Bijou provides two primary output formats:

1. **String-first**: Returns a themed ANSI string. Best for standalone CLIs and scripts.
2. **Surface-first**: Returns a `Surface` (byte-buffer). Best for high-performance TUIs and complex layouts.

Naming follows the same rule across families: the base export is the public
family name, and a `*Surface()` companion means “this family on the composable
surface path.” If there is no `*Surface()` variant, that usually means the
family is already surface-native, intentionally string-first, or a second name
would only create fake API duplication.

### Choosing Feedback Surfaces
- **`badge()`**: Compact, inline status.
- **`note()`**: Explanatory, non-urgent supporting text.
- **`alert()`**: Persistent message that stays in the document flow.
- **`guidedFlow()`**: Calm multi-step assistance with one obvious next action.
- **`explainability()`**: AI- or machine-mediated recommendation with explicit provenance and evidence.
- **`markdown()`**: Renders formatted prose with mode-aware fallbacks.

### Choosing Prompts
- **`input()`**: Raw text entry.
- **`select()`**: Single choice from a stable list.
- **`filter()`**: Search-led choice from a large or dynamic set.
- **`multiselect()`**: Choosing multiple values to build a set.
- **`confirm()`**: Strictly binary (yes/no) decisions.

### Layout & Containers
- **`box()` / `boxSurface()`**: Visible containment with optional titles.
- **`headerBox()`**: Region with a title and a detail line.
- **`separator()`**: Section divider with an optional label.

### Data & Hierarchy
- **`table()` / `tableSurface()`**: Passive row/column comparison. The common case now supports `table(columns, rows, ctx)` and `tableSurface(columns, rows, ctx)` shorthands, while the object form remains available for advanced token/overflow options.
- **`tree()`**: Parent/child nesting.
- **`timeline()`**: Chronological sequences.
- **`dag()` / `dagSlice()`**: Causal or dependency-based graphs.

### Progress & Loading
- **`progressBar()`**: Determinate completion.
- **`spinnerFrame()`**: Indeterminate activity.
- **`skeleton()`**: Short-lived loading placeholders.

## Themes

### Presets
`cyan-magenta` (default), `nord`, `catppuccin`.

### Lookups
Use token helpers on the context to avoid coupling to theme structure:
```typescript
const primary = ctx.semantic('primary');
const border = ctx.border('muted');
const success = ctx.status('success');
```

For the canonical meaning of each token family and the first-party usage rules,
read [Theme Token Vocabulary](../../docs/design-system/theme-tokens.md).

For a copy-paste starter theme, DTCG JSON shape, and the practical loading
path for custom themes, read
[Theme Authoring Guide](../../docs/design-system/theme-authoring.md).

## Custom Components

Build mode-aware components using the `renderByMode` dispatcher:

```typescript
import { renderByMode, resolveCtx, type BijouContext } from '@flyingrobots/bijou';

export function myComponent(text: string, options: { ctx?: BijouContext } = {}) {
  const ctx = resolveCtx(options.ctx);
  return renderByMode(ctx.mode, {
    pipe: () => `[${text}]`,
    interactive: () => ctx.style.styled(ctx.semantic('accent'), `✨ ${text}`),
  }, options);
}
```

## Block Authoring

Use `defineBlock()` when a reusable app-level composition needs stable metadata
that tools can inspect before rendering:

```typescript
import { defineBlock, defineBlockPackage } from '@flyingrobots/bijou';

export const readerSurfaceBlock = defineBlock({
  metadata: {
    packageName: '@example/bijou-blocks-docs',
    blockName: 'ReaderSurface',
    family: 'content-reading',
    scale: 'section',
    modes: ['interactive', 'static', 'pipe', 'accessible'],
    docs: { summary: 'Readable content with optional navigation and outline slots.' },
    slots: [
      { id: 'content', required: true },
      { id: 'navigation', required: false },
      { id: 'outline', required: false },
    ],
    composedComponents: ['markdown', 'viewportSurface'],
    storyIds: ['reader-surface/docs-reader'],
  },
  render: ({ slots }) => ({ output: slots?.content ?? '' }),
});

export const docsBlocks = defineBlockPackage({
  packageName: '@example/bijou-blocks-docs',
  version: '1.0.0',
  bijouPeerRange: '^5.0.0',
  blocks: [readerSurfaceBlock.metadata.blockName],
});
```

Blocks are explicit imports, not runtime plugins. `BlockMetadata` and
`BlockPackageManifest` are intended for docs, DOGFOOD, MCP payloads, and package
compatibility checks; schema-bound blocks are still a follow-on layer.

## Binding Frames

Use binding primitives when a view should render provider-delivered data without
receiving a provider handle:

```typescript
import {
  bindingFrame,
  bindingFrameFromSnapshots,
  bindingSnapshot,
  commandIntent,
  defineDataRequirement,
  defineDataProvider,
  defineViewData,
  provide,
  providerScope,
  resolveProviderRequirement,
} from '@flyingrobots/bijou';

const article = defineDataRequirement({
  id: 'article',
  resource: 'docs.article',
});
const articleProvider = defineDataProvider({
  id: 'docs.articleProvider',
  resource: article.resource,
});
const providers = providerScope([provide(articleProvider)], {
  id: 'docs.appShell',
});
const readerData = defineViewData({
  id: 'reader.data',
  requirements: [{ name: 'article', requirement: article }],
});

const frame = bindingFrame([
  bindingSnapshot({
    providerId: articleProvider.id,
    requirementId: article.id,
    version: 1,
    status: 'ready',
    data: { title: 'DX-034' },
  }),
]);

const openArticle = commandIntent<{ articleId: string }>('docs.openArticle');
const resolution = resolveProviderRequirement(article, providers);
const assembled = bindingFrameFromSnapshots({
  resolutions: [resolution],
  snapshots: [
    bindingSnapshot({
      providerId: articleProvider.id,
      requirementId: article.id,
      version: 1,
      status: 'ready',
      data: { title: 'DX-034' },
    }),
  ],
});

frame.require<{ title: string }>('article');
frame.status('article');
providers.has(article.resource);
readerData.requirement('article');
resolution.status;
assembled.frame.status('article');
openArticle.id;
```

`ProviderScope` is an explicit local registry of provider metadata. It does not
subscribe, refresh, resolve active views, dispatch commands, or register globals.
`ViewDataContract` groups named requirements before any provider binding occurs.
`resolveProviderRequirement()` resolves against exactly the scope it receives and
returns frozen metadata for tooling and runtime handoff; it still does not fetch,
subscribe, or walk a view hierarchy.
`bindingFrameFromSnapshots()` assembles a render frame from resolved provider
metadata and already-created snapshots; provider reads remain outside this
contract.
`BindingFrame` is only the immutable render-time data frame. Provider
resolution hierarchy, subscriptions, active-view lifecycle, schema adapters, and
command dispatch remain runtime follow-on layers.

Snapshot data is copied before it is frozen. Use inert plain snapshot data:
null, strings, numbers, booleans, arrays, and enumerable string-keyed plain
objects. Mutable built-ins and executable values such as `Map`, `Set`, `Date`,
typed arrays, functions, accessors, symbol-keyed properties, symbols, and bigint
are rejected at the binding boundary.

## Testing

Use `createTestContext` to verify behavior across all modes without mocking:

```typescript
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { box } from '@flyingrobots/bijou';

const ctx = createTestContext({ mode: 'pipe' });
const result = box('hello', { ctx });
expect(result).toBe('hello'); // In pipe mode, boxes are stripped.
```
