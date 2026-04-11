# Migrating to Bijou 4.4.1

## No Breaking Changes

Bijou 4.4.1 is a backwards-compatible patch release. All existing
`4.4.0` code continues to work unchanged.

## If You Added a Terminal Background Workaround in 4.4.0

Some apps worked around the 4.4.0 regression by pre-setting the
terminal background before calling `run()`.

```ts
process.stdout.write('\x1b[48;2;45;25;34m');
await run(app, { ctx });
```

That prefill should no longer be necessary when you use
`createFramedApp()` with a theme that sets `surface.primary.bg`.

Leaving the workaround in place is usually harmless when it matches your
theme, but Bijou now renders the framed body background explicitly.

## Optional: Move App-Local Theme Toggles Into `shellThemes`

If your app currently manages shell theme switching in page-local state,
you can now hand that concern to the stock frame:

```ts
let currentCtx = ctx;
const getCurrentCtx = () => currentCtx;

const app = createFramedApp({
  ctx: currentCtx,
  shellThemes: [
    { id: 'default', label: 'Default', theme: defaultTheme },
    { id: 'verdant-plum', label: 'Verdant Plum', theme: plumTheme },
  ],
  onShellThemeChange: ({ ctx: nextCtx }) => {
    currentCtx = nextCtx;
  },
  pages: [{
    id: 'home',
    title: 'Home',
    init: () => [model, []],
    update: (msg, model) => [model, []],
    layout: (model) => ({
      kind: 'pane',
      paneId: 'main',
      render: (width, height) => renderHome(getCurrentCtx(), model, width, height),
    }),
  }],
});
```

The frame will:

- add a stock shell-theme row to the settings drawer
- keep the resolved shell theme in one shared frame-owned place
- expose the current selection via `FrameModel.activeShellThemeId`

If your page renderers already resolve theme data from an explicit
`BijouContext`, pass that context into `createFramedApp({ ctx })`,
mirror `onShellThemeChange` back into your app-owned state, and make
your page renderers read the updated context on each render. Apps that
rely only on the ambient default context can omit both options; the
frame will update that default context when the stock shell theme
changes.

You do not need to adopt this API, but it is now the simplest way to
keep a landing screen, docs shell, or other frame-owned chrome on one
theme source of truth.

## Quit Confirm Input Is More Forgiving

The stock quit dialog now accepts uppercase `Y` / `N` alongside
lowercase `y` / `n`. No migration work is required.
