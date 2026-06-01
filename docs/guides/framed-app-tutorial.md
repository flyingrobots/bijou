# Framed App Tutorial

This guide is the middle path between the tiny counter and DOGFOOD. Use it when
you want a real app shell with pages, panes, shared chrome, overlays, and a
command palette without reading the full documentation app first.

## Run the demo

```bash
npm run app-frame
```

The command runs `examples/app-frame/main.ts`.

Useful keys:

| Key | Action |
| :--- | :--- |
| `Tab` | Move focus between panes. |
| `[` / `]` | Move between pages. |
| `x` | Increment the demo counter. |
| `o` | Toggle the inspector drawer. |
| `Ctrl-P` | Open the command palette. |
| `q` | Request quit. |

## What the demo teaches

The counter example teaches the smallest app shape:

```text
Model -> update(Msg) -> view(Model)
```

The framed app adds shell structure:

```text
createFramedApp
  pages
    page model
    page update
    page layout
  global key map
  overlay factory
```

Use this when your app has:

- more than one work area,
- tabbed or page-based navigation,
- pane focus,
- shell-owned help or command palette,
- a settings, inspector, or notification overlay.

Stay with `startApp(app)` when the app is one prompt, one report, or one small
interactive surface.

## Step 1: Page state

The demo keeps page state in one plain object:

```ts
interface PageModel {
  count: number;
  inspector: boolean;
  editorSplit: ReturnType<typeof createSplitPaneState>;
}
```

The important part is not the exact fields. The point is that visible app
state lives in the model, so a frame can be rendered from a model snapshot.

## Step 2: Page updates

Messages describe user intent:

```ts
type Msg =
  | { type: 'inc' }
  | { type: 'toggle-inspector' };
```

The update function changes state and returns commands. This demo has no async
commands, so it returns an empty command list:

```ts
function updatePageModel(msg: Msg, model: PageModel): [PageModel, []] {
  if (msg.type === 'inc') return [{ ...model, count: model.count + 1 }, []];
  if (msg.type === 'toggle-inspector') {
    return [{ ...model, inspector: !model.inspector }, []];
  }
  return [model, []];
}
```

## Step 3: Page layouts

A framed page returns a layout description instead of drawing the entire app
chrome by hand. The shell owns the shared frame; the page owns its body:

```ts
const editorPage = createPage('editor', 'Editor', (model) => ({
  kind: 'split',
  splitId: 'editor-shell',
  state: model.editorSplit,
  paneA: { kind: 'pane', paneId: 'files', render: renderFiles },
  paneB: { kind: 'pane', paneId: 'content', render: renderContent },
}));
```

That keeps header, tabs, footer hints, help, and overlays consistent across
pages.

## Step 4: Shell keys and overlays

Use a page key map for page-local actions and a global key map for shell-wide
actions:

```ts
const globalKeys = createKeyMap<Msg>()
  .bind('o', 'Toggle inspector drawer', { type: 'toggle-inspector' });
```

The overlay factory receives the current frame state and can attach shell-owned
surfaces such as an inspector drawer without each page reimplementing overlay
placement.

## Step 5: When to move beyond this demo

Move from the tutorial to the scaffolder when you want a standalone app
project:

```bash
npm create bijou-tui-app@latest my-app
```

Move from the tutorial to DOGFOOD when you want to inspect a production-scale
Bijou app that wires docs, Blocks, localization, settings, search, and smoke
proof in one place.

## Read next

- [examples/app-frame](../../examples/app-frame/README.md)
- [README Choosing Your Path](../../README.md#choosing-your-path)
- [Terminal Scenarios](./terminal-scenarios.md)
- [DOGFOOD](../DOGFOOD.md)
