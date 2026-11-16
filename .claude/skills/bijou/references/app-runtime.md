# App runtime and the framed shell

Source of truth: `packages/bijou-tui/src` (`types.ts`, `runtime-*.ts`, `commands.ts`, `keybindings*.ts`,
`app-frame-*.ts`), `packages/bijou-node/src/start-app.ts`. Guides: `docs/guides/getting-started.md`,
`docs/guides/framed-app-tutorial.md`. Examples: `examples/hello`, `examples/counter`, `examples/app-frame`.

## The App contract

```ts
interface App<Model, M = never> {
  init(): [Model, Cmd<M>[]];
  update(msg: KeyMsg | ResizeMsg | MouseMsg | PulseMsg | M, model: Model): [Model, Cmd<M>[]];
  view(model: Model): Surface | LayoutNode; // a raw string throws: wrap it with stringToSurface/contentSurface
  routeRuntimeIssue?(issue: RuntimeIssue): M | undefined;
}
```

- Start on Node with `await startApp(app)` (bijou-node). It creates and registers the context
  (`initDefaultContext()`), accepts theme options (`theme`, `presets`, `themes`, `themeMode`, `themeOverride`), and
  runs framed apps through their own `run`. `run(app, options)` (bijou-tui) is the lower-level loop:
  `altScreen`, `hideCursor` (both default true), `mouse` / `mouseMode`, `ctx`, `css` (BCSS), `middlewares`.
- In any mode other than `interactive`, `run` renders `view(initModel)` once and returns: there is no loop. Design
  `init` so the first view is meaningful on its own.
- Ctrl+C reaches `update` first; a second press within 1 s force-quits.

## Messages

`KeyMsg {type:'key', key, ctrl, alt, shift}`, `ResizeMsg {columns, rows}`, `PulseMsg {dt}` (seconds, every frame),
`MouseMsg {button, action: press|release|move|scroll-up|scroll-down, col, row, ...}`. Guards: `isKeyMsg`,
`isPulseMsg`, `isResizeMsg`, `isMouseMsg`. Key names are lowercase: `up`, `pageup`, `f2`, `enter`, `tab`,
`escape`, `space`, `backspace`; Shift+Tab is `{key:'tab', shift:true}`; Ctrl+letter is `{key:'p', ctrl:true}`.

## Commands

`type Cmd<M> = (emit, caps) => M | QUIT | cleanup | undefined | Promise<...>`. A command may return a message,
call `emit` any number of times, return `QUIT`, or return a cleanup (`() => void` or `{ dispose() }`) for
long-lived work. `caps` offers `onPulse(handler)`, `sleep(ms)`, `now()`.

Built-ins are deliberately few: `quit()`, `tick(ms, msg)`, `batch(...cmds)`, and `animate(...)` (see
motion-graphics.md). Write a custom `Cmd` for anything else (`after`, intervals, I/O).

## Key maps

```ts
const keys = createKeyMap<Msg>()
  .group('Navigation', (g) => g.bind('j', 'Down', { type: 'down' }).bind('pagedown', 'Next page', { type: 'page' }))
  .bind('ctrl+p', 'Palette', { type: 'palette' });
const action = keys.handle(keyMsg); // Msg | undefined
```

Descriptors are lowercased before parsing, so write `shift+g`, not `G`. `enable`/`disable`, `enableGroup`, and
`bindings()` exist; `helpView`, `helpShort`, `helpFor` render help from any key map. Group names describe jobs
(Navigation, Actions, Selection).

## createFramedApp

```ts
const app = createFramedApp({
  title: 'Ops',
  pages: [{ id: 'home', title: 'Home', init, update, layout, keyMap }],
  globalKeys, keyPriority: 'page-first',
  enableCommandPalette: true,          // ctrl+p or ':' ; pages add commandItems/searchItems
  settings: ({ pageModel }) => ({ sections: [...] }),   // providing settings (or shellThemes) enables F2
  shellThemes, onShellThemeChange,     // see theming.md
  i18n,                                // I18nRuntime from @flyingrobots/bijou-i18n
  transition: 'dissolve', transitionDuration: 300,
  overlayFactory: ({ pageModel, paneRects, screenRect }) => [/* Overlay[] */],
  bodyTopRows: 1, bodyBottomRows: 1,
});
await startApp(app);
```

- **Pages never receive raw `KeyMsg`.** Keys reach a page as actions from its `keyMap`, `globalKeys`, input areas,
  or `modalKeyMap`. A page's `update` gets `Msg | MouseMsg | PulseMsg`.
- **Layout nodes** (`layout(model)`): `{kind:'pane', paneId, render(w, h)}`,
  `{kind:'split', splitId, state, paneA, paneB, direction?}` (create `state` once with `createSplitPaneState` and
  keep it in the page model), `{kind:'grid', gridId, columns, rows, areas, cells}`. Pane ids are unique.
- **Single-pane pages get no focus gutter**; split and grid pages show a one-column gutter on the focused pane.
- **Any overlay dims the whole page.** Use overlays for modal-like layers only; draw persistent chrome (a status
  row, a progress bar) inside the page instead.
- **Settings rows:** `{ id, label, description?, valueLabel?, kind: 'toggle'|'choice'|'action'|'info', action?: Msg,
  feedback?: { title?, message } }`.
- **Messaging the frame** from a page: `notify(spec)`, `emitFrameAction(action)`, `emitMsgForPage`.
- **Built-in frame keys:** `?` help, `/` search, `ctrl+p` palette, `f2` or `ctrl+,` settings, `[`/`]` tabs,
  `tab`/`shift+tab` panes, `j k d u g G h l` scroll, `ctrl+t` theme mode, `shift+n` notifications, `` ` `` perf
  HUD. `q`, `escape`, and `ctrl+c` open the quit confirmation (immediate in pipe mode). Pick page keys that do not
  collide; `keyPriority: 'page-first'` lets the page win.
- **Help scrolls** with the arrows and the frame scroll keys when it is taller than the screen.

## Context gotchas

- `getDefaultContext()` throws until a context exists: call `startApp`, `initDefaultContext()`, or
  `setDefaultContext(ctx)`. Prefer passing `ctx` explicitly to components and `run`.
- Inside the Bijou repo, bijou-tui source imports the built `@flyingrobots/bijou`, so two default-context
  registries can exist. Tools that render outside `run` (recorders, tests) set both.
