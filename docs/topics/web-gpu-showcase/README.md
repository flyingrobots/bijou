# Web GPU showcase

This page is the reference for `examples/web-gpu`, a Vite page that mounts
Bijou example apps with `mountBijouCanvas()` on Geordi's presenters. To run
it, read the [showcase README](../../../examples/web-gpu/README.md). The
cases that hold this behavior are listed in the [test plan](./test-plan.md).

## What it mounts

| App | Source | How it loads |
| --- | --- | --- |
| `counter` | `examples/counter/main.ts`, unmodified | The build resolves `@flyingrobots/bijou-node` to `src/browser-start-app.ts`, whose `startApp(app)` hands the app to the page instead of starting a terminal run. |
| `components` | `examples/components/library.ts` | `createLibraryApp(ctx)` with the `LIBRARY_CSS` stylesheet, which is what `examples/components/main.ts` runs with no arguments. |
| `hero` | `examples/hero/app.ts` | `createHeroApp()` with the run's context and grid, and a perf tracker from `examples/hero/perf.ts` on the browser adapter of its memory port, as `examples/hero/main.ts` does with the Node adapter. |
| `showcase` | `examples/showcase/app.ts`, unmodified | `createShowcaseApp(ctx)`, built from the run's context. |
| `dual` | `examples/web-gpu/src/dual/dual-app.ts` | `createDualApp(ctx)`, a semantic scene app: `view()` paints cells and `viewScene()` describes the same model, so it mounts on either host. |

Each mount passes `mountBijouCanvas()` a factory that sets the run's context
as the default context, as `startApp()` does on Node, and then returns the
app, and the app's stylesheet as `css` when it has one. The apps are made at
different times:

- The counter's `App` is created when `load()` imports
  `examples/counter/main.ts`, once per page, before any mount. Module-level
  code there never sees a mount's context; the factory returns the existing
  `App`, whose `view()` reads the default context when it renders.
- The other apps are created inside the factory, once per mount, with that
  mount's context.

No example app is refused. The HUD's refused list (`src/refused-apps.ts`) is
empty, and an app that came to import a Node built-in would be listed there
with its `BIJOU_WEB_GPU_NODE_IMPORT` refusal.

### Host-free example apps

The `components` and `hero` app modules import no Node built-in and use no
`process` or `Buffer`, through any import or re-export.
`tests/web-gpu/app-host-reach.test.ts` bundles each one with the showcase's
resolution and lists every one it finds. Data they used to read from disk at
module load is imported instead, so the bundler inlines it:

| Data | Source | How it is imported |
| --- | --- | --- |
| DM Sans and Jacquard 12 raster fonts | `assets/dm-sans-ascii.json`, `assets/jacquard12-bijou.json` | JSON import attributes. Coverage masks are decoded by `examples/_shared/base64.ts`, which accepts exactly the canonical base64 that `Buffer` round-trips. |
| DOGFOOD runtime catalogs | `examples/docs/i18n/catalogs/<locale>/*.json` | JSON import attributes, one table entry per file. `tests/dogfood-catalog-imports.test.ts` holds the table to the directory. |
| Example code snippets and design-system families | The story sources in `examples/docs/` and `docs/design-system/component-families.md` (in the archived book corpus) | Generated copies in `examples/components/generated/`, written by `npm run components:data`. `tests/components-browser-data.test.ts` regenerates them and fails on drift; `npm run components:data:check` does the same. |

The hero perf overlay reads memory through a port (`MemorySampler` in
`examples/hero/perf.ts`). `perf-node.ts` reads `process.memoryUsage()`;
`perf-browser.ts` reports nothing, because a page has no standard measure of
its heap or resident set, so in the browser the overlay shows no heap or RSS
row.

`tests/examples-terminal-frames.test.ts` pins, by digest, the styled frames
both apps paint in a 120 by 36 terminal, recorded before the data moved to
imports. `tests/web-gpu/app-cell-widths.test.ts` paints every Components
library slide in each output mode and the hero reel, and finds no width-2
grapheme and no unpacked Surface, either of which the canvas contract
refuses.

The showcase bundle loads each app on demand, so the page's entry chunk does
not carry them. The Components library's chunk carries its inlined fonts,
snippets, families and catalogs and is the largest, about 620 KB before
compression.

## Build

`vite.config.ts` bundles the Bijou packages from source, so each module, and
each module-level singleton such as the default context, has one copy. A
plugin refuses every Node.js built-in: an import of one fails the build with
`BIJOU_WEB_GPU_NODE_IMPORT: <module> imported by <file>`. No Node polyfill or
browser stub is bundled.

Geordi comes from two tarballs in `examples/web-gpu/vendor/`, packed at the
commit that `geordi-pin.json` records, and installed through `file:`
development dependencies whose `integrity` the lockfile records. The sealed
dependency worker receives those tarballs with the manifests, so the sealed
build is offline. The tarballs are the only vendored files: the
`@flyingrobots/geordi-bijou-gpu` package ships Geordi's procedural glyph table,
so the Canvas 2D presenter needs no table from the page.

## Presenters

All three presenters draw from one `GlyphAtlas`, built with Geordi's canvas
glyph rasterizer and its font and DPR watcher, in the font
`Menlo, "DejaVu Sans Mono", "Liberation Mono", monospace` at 14 CSS pixels on
a 9 by 18 CSS-pixel cell. Glyph pixels depend on the host's fonts. Unset
colours are `#E6EDF3` and `#0D1117`.

| Backend | Factory | Receipt |
| --- | --- | --- |
| WebGPU | `createWebGPUSurfacePresenter(canvas, { atlas })` | The HUD reads `captureFrame()`, so the receipt is probed. |
| WebGL2 | `createWebGL2SurfacePresenter({ canvas, atlas, canonicalReadback: true })` | Every frame is read back, so the receipt is probed. |
| Canvas 2D | `createCanvas2DSurfacePresenter({ canvas, atlas })` | Computed on the CPU and always `software-probed`. |

A mount's `cellPx` is fixed. When the watcher reports a new device pixel
ratio, the atlas has a new cell size and the page mounts the app again.

## HUD

| Row | Source |
| --- | --- |
| App, Backend, Fallback reasons | The mount handle: `backend` and `fallbackReasons`, each as `backend: code (reason)`. |
| Host | `Canvas` or `DOM`: which host presents the app. For an app with no scene projection it reads `Canvas (no DOM: <title> has no scene projection)`. |
| Model | The live model's own string, number and boolean fields as `name value` pairs, cut at 96 characters. |
| Grid | `ctx.runtime.columns` by `ctx.runtime.rows`. |
| Cell, Device pixel ratio | The physical cell size and ratio the current mount was made with, so they always match its grid. |
| Frame time | Milliseconds the last `present()` call took, measured around the call, and the number of frames presented. |
| Evidence, Adapter, Atlas generation, Shader, Frame | The newest receipt: `evidenceLevel`, `adapter`, `atlasGeneration`, `shaderSha256` and `frameRgbaSha256`. |
| WebGL2 context | `lost` while the WebGL2 presenter reports a lost context. |
| Refusal or fault | `CODE: message` of a mount refusal or a fault that ended the run. |

`gpu-probed` means a named hardware adapter drew the frame and it was read
back; `software-probed` means a software rasterizer, or the Canvas 2D CPU path,
drew it. A receipt from `present()` without readback would be `unit-upload`;
the page always reads back, so the HUD never shows it.

## Controls

| Control | Effect |
| --- | --- |
| App toggle group | Stop the mounted app and mount another. Operations run one at a time. |
| Host toggle group | Stop the mount and present the same app, with its model, on the other host. The DOM item is disabled for an app with no scene projection, and a line under the group says why. `Space` then `m` does the same. |
| Backend toggle group | `switchBackend()` to that backend on a fresh canvas. Disabled while the DOM host presents. |
| Lose the WebGL2 context | `WEBGL_lose_context.loseContext()`, then `restoreContext()` once the presenter reports the loss. |
| Reset the glyph atlas | `atlas.invalidate(undefined, 'manual')`, a new atlas generation. |

`window.__bijouWebGpu` exposes the HUD state and these operations to the
browser suite, with `cellRect()`, which reads cells at the mount's cell size,
and `failures()`, every operation that failed, which a later mount does not
clear. A boot failure or a HUD refresh that fails is shown in an alert under
the Surface. A WebGPU readback that rejects because a switch disposed its
presenter shows no receipt. The command palette runs the same operations.

## Page chrome

Both pages' chrome is a React app of shadcn components from the
`@flyingrobots` registry, with a theme-book light, dark and system theme; the
[showcase README](../../../examples/web-gpu/README.md#the-page-chrome) lists the
items, the theme command, the layout and the keys. The chrome never restyles
what Bijou renders: the Surface container and the DOM host are empty
`data-bijou-mount` elements, and `[data-bijou-mount] * { all: revert; }` keeps
every chrome rule off the elements a mount creates.

The focus rule: while focus is inside a Bijou mount, every key goes to the
mounted app and the page acts on none; the page's keys (`Esc` for the command
palette, `h` `j` `k` `l` and the arrows to move, `Space` then a key for a
feature) work only while focus is in the chrome.

## DOM host check page

`examples/web-gpu/dom.html` is not part of the showcase. Inside the same
chrome, it mounts a small semantic scene app (`src/dom/controls-app.ts`: a status, a Button, a text
input with a greeting that follows it, and a switch) with `mountBijouDom()`,
passing the real `document` (`src/dom/probe.ts`). `window.__bijouDom` exposes the model, the
controller's diagnostics and `stop()` to the browser suite. The model counts
every action message it receives in `dispatches`.

## Host switch

An app with a scene projection (a `SemanticSceneApp`: an ordinary app plus
`viewScene()` and `dispatchAction()`) can be presented two ways. The canvas
host is `mountBijouCanvas()`, which paints `view()` and sends key messages.
The DOM host is `mountBijouDom()`, which lowers `viewScene()` to native
elements and sends the scene's actions.

Switching reads the model from the live mount, stops that mount and waits for
it, then starts the other host with the app wrapped by `withCarriedModel()`
(`src/handoff.ts`), whose `init()` returns the carried model and no commands.
The app's own init commands are not run again. Exactly one mount is alive at a
time, and the switch runs on the same queue as every other operation.

Coming back to the canvas uses the backend the canvas last presented on. If
the new host cannot start, the previous host is started again with the same
model and the HUD's refusal row shows the reason. A request for the DOM host
on an app with no scene projection is refused with `BIJOU_WEB_GPU_NO_SCENE`
and changes nothing.

Of the five apps only `dual` has a scene projection. The DOM host lowers
`group` and `text` nodes only, so its scene stays within those. A name the
canvas cannot hold (a character two cells wide) is painted as `?` per
character on the canvas and kept whole in the scene.

## Evidence

The browser suite runs in Google Chrome, headless.

| Where | Chrome | WebGL2 | Canvas 2D | WebGPU |
| --- | --- | --- | --- | --- |
| Apple M5 Mac, locally | 158.0.8127.36 | ANGLE on Metal, `gpu-probed` | `software-probed` | Metal adapter, `gpu-probed` |
| Hosted Ubuntu runner, `browser_web_gpu` job | 157.0.8103.78 | ANGLE on SwiftShader, `software-probed` | `software-probed` | No adapter: the case is skipped as capability-refused |

For the counter, the WebGPU, WebGL2 and Canvas 2D frames have the same
`frameRgbaSha256`; the golden and WebGPU cases assert it.

The components and hero apps mount with `auto`: on the Mac they present on
WebGPU with a `gpu-probed` receipt, and on the hosted runner, which has no
WebGPU adapter, on WebGL2 with a `software-probed` one. The stress case also
puts them on WebGL2 and Canvas 2D. Their frames are not compared across
backends.

Not verified: Firefox, Safari, a device pixel ratio other than 1, a DPR change
during a run, IME composition and paste in a real browser, and any timing
budget.
