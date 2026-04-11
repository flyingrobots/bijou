# What's New in Bijou 4.4.1

## Framed Shell Backgrounds Render Correctly Again

Bijou 4.4.1 fixes the `createFramedApp()` background-fill regression
introduced in 4.4.0 and extends the fix to the stock shell chrome.
Apps that set a custom `surface.primary.bg` could lose that body
background when pane content, gutters, scrollbars, split dividers, or
other frame-owned surfaces were rendered, causing the terminal default
background to show through. The stock header and footer rows could also
fall back to black when BCSS did not provide explicit shell backgrounds.

### What changed

- The frame body is now explicitly filled with the primary surface
  background before pane composition.
- Pane surfaces stamp that background into otherwise unstyled cells
  before blitting, so plain text and blank cells inherit the intended
  body fill.
- Gutter, scrollbar, split-divider, minimized-pane, and missing-grid
  placeholder writes now preserve an existing background instead of
  wiping it.
- The stock header and footer rows now inherit the resolved frame
  background when shell-specific BCSS background rules are absent.

### What this means for app authors

If your app themes `surface.primary.bg`, the framed shell should now
render that color consistently across both the workspace body and the
shell chrome.

## `createFramedApp()` Gets Stock Shell Themes

`createFramedApp()` now supports opt-in, frame-owned shell theme
cycling:

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

When `shellThemes` are provided:

- the frame pre-resolves those themes once against the provided Bijou
  context, or the active default context when `ctx` is omitted
- the stock settings drawer gets a built-in shell-theme choice row
- the current selection is exposed as `FrameModel.activeShellThemeId`

If your page renderers read from an explicit app-owned `BijouContext`,
pass that context to `createFramedApp({ ctx })`, mirror
`onShellThemeChange` back into your app state, and make your page
renderers read the updated context on each render so the frame shell and
page content stay on one theme source of truth. Apps that rely on the
ambient default context can omit that wiring; the frame updates the
default context when the stock shell theme changes.

DOGFOOD now uses that shared frame-owned state so the title screen and
docs explorer stay on one theme setting instead of drifting into mixed
landing/app themes. The release also adds the new `Verdant Plum`
palette used to prove the background-fill fix visually.

## Quit Confirm Accepts Uppercase Input

The stock shell quit dialog now accepts uppercase `Y` and `N` in
addition to lowercase `y` and `n`. This does not change the overall quit
policy or the existing `Enter`, `Esc`, and `q` behavior.

## Compatibility

Bijou 4.4.1 is a backwards-compatible patch release. The new framed
shell theme support is optional.
