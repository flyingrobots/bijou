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
import {
  commandIntent,
  bindSchemaBlockInput,
  defineBlock,
  defineBlockPackage,
  defineBlockSchemaAdapter,
  defineDataRequirement,
  defineSchemaBlock,
  defineViewData,
} from '@flyingrobots/bijou';

const article = defineDataRequirement({
  id: 'article',
  resource: 'docs.article',
});

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
  data: defineViewData({
    id: 'reader.data',
    requirements: [{ name: 'article', requirement: article }],
  }),
  commands: [commandIntent<{ articleId: string }>('reader.openArticle')],
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
compatibility checks. `data` and `commands` are inspectable contracts, not
runtime provider handles or command callbacks.

Use schema-bound blocks when unknown boundary data needs validation before it
becomes render input:

```typescript
const articleSchema = defineBlockSchemaAdapter<{ id: string; title: string }>({
  id: 'docs.article',
  parse(input) {
    if (
      input === null
      || typeof input !== 'object'
      || typeof (input as { id?: unknown }).id !== 'string'
      || typeof (input as { title?: unknown }).title !== 'string'
    ) {
      return {
        ok: false,
        issues: [{
          severity: 'error',
          code: 'article.invalid',
          message: 'Article data is required.',
        }],
      };
    }

    return {
      ok: true,
      data: {
        id: (input as { id: string }).id,
        title: (input as { title: string }).title,
      },
    };
  },
});

const articleReaderBlock = defineSchemaBlock({
  block: readerSurfaceBlock,
  schema: articleSchema,
  bind: article => ({
    input: { slots: { content: article.title } },
    facts: [{ kind: 'entity', key: 'article', value: article.id }],
  }),
});

const bound = bindSchemaBlockInput(articleReaderBlock, {
  id: 'intro',
  title: 'Introduction',
});
```

Schema-bound blocks validate shape at the block boundary. They do not fetch,
subscribe, dispatch commands, resolve providers, render AppShell, or register
global runtime behavior.

## First-Party Standard Blocks

Bijou exports the first-party standard block definitions:

```typescript
import {
  appShellBlock,
  inspectorPanelBlock,
  readerSurfaceBlock,
  standardBlockPackageManifest,
  standardBlockStories,
  standardBlocks,
} from '@flyingrobots/bijou';

standardBlocks.map(block => block.metadata.blockName);
standardBlockStories.map(story => story.id);
standardBlockPackageManifest.blocks;

readerSurfaceBlock.data?.names();
readerSurfaceBlock.commands?.map(command => command.id);
inspectorPanelBlock.data?.names();
appShellBlock.metadata.slots.map(slot => slot.id);
```

These definitions declare metadata, semantic slots, data requirements, command
intents, story ids, package visibility, and deterministic first-proof render
output for `AppShell`, `ReaderSurface`, and `InspectorPanel`.

They do not implement provider subscriptions, active runtime traversal, command
dispatch, production AppShell behavior, DOGFOOD multi-mode captures, or the
full standard block catalog.

## AppShell Composition

Use `defineAppShellComposition()` to describe logical shell slots before
AppShell rendering, provider resolution, or subscription lifecycle is
introduced:

```typescript
import {
  defineAppShellComposition,
  defineDataProvider,
  provide,
  providerScope,
} from '@flyingrobots/bijou';

const providers = providerScope([
  provide(defineDataProvider({
    id: 'docs.articleProvider',
    resource: article.resource,
  })),
], { id: 'docs.shell.providers' });

export const docsShell = defineAppShellComposition({
  id: 'docs.shell',
  providers,
  slots: {
    content: readerSurfaceBlock,
  },
});

docsShell.slot('content');
docsShell.dataContracts();
docsShell.commandIntents();
```

AppShell composition slots are structural. They group runtime-backed block
definitions by semantic region, expose nested data and command contracts for
tooling, and keep provider scopes explicit. They do not render, refresh,
subscribe, dispatch commands, or walk the active view hierarchy.

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
