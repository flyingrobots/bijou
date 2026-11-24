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
| `dogfood` | `examples/docs/app.ts` | `createDocsApp(ctx, { localePort })`, imported by the name `@bijou-examples/docs`, which `vite.config.ts` resolves to the app and `src/dogfood/docs-app.d.ts` describes to the showcase's stricter `tsconfig.json`. The locale port (`src/dogfood/browser-locale.ts`) offers the browser's first language until the reader picks one in the app, and keeps the choice in the port, so in the page. |
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
| DOGFOOD package version, prompt font | `packages/bijou/package.json`, `assets/space-grotesk-ascii.json` | JSON import attributes; the font's masks go through `examples/_shared/base64.ts`. |
| DOGFOOD landing logo, translated guides | `assets/flyingrobotslogo.txt`, `examples/docs/content/i18n/<locale>/<guide>.md` | Generated JSON in `examples/docs/generated/`, written by `npm run components:data`. `tests/dogfood-browser-data.test.ts` regenerates it and fails on drift. |
| DOGFOOD documents | The Markdown files its guides read, and `docs/design-system/component-families.md` | One seam, `examples/_shared/documents.ts`: in Node, the live file and then the SHA-256-verified book corpus. The showcase's build swaps it, with the plugin in `examples/web-gpu/documents-plugin.ts`, for a reader over a table of exactly the documents the app reads, made from the files at build time. Nothing is committed, so editing a document never needs a generator run. The reader imports nothing from Node. |
| Example code snippets and design-system families | The story sources in `examples/docs/` and `docs/design-system/component-families.md` (in the archived book corpus) | Generated copies in `examples/components/generated/`, written by `npm run components:data`. `tests/components-browser-data.test.ts` regenerates them and fails on drift; `npm run components:data:check` does the same. |

The document table is made in memory at build time by
`scripts/dogfood-documents.ts`, from the localization inventory's own discovery
of `readMarkdownDoc('<literal>')` call sites, the translations of each that
exist, and each `./content/<name>.md` literal. The page does not hash.
`tests/dogfood-documents.test.ts` makes the same table and checks that it holds
exactly the documents the app reads in every locale, that the browser reader
answers each key as the Node adapter does, and that each text equals its live
file or, for a file that exists only in the book corpus, the corpus record with
its recorded SHA-256.

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
not carry them. In the production build, the entry chunk of the showcase page
is `main-*.js` at 16.5 kB, with its preloaded chunks `mount-host-*.js` at
481 kB and `keys-card-*.js` at 155 kB; neither holds an app. The DOGFOOD chunk
(`app-*.js`, 1,326 kB before compression) carries the document table, the
translated guides, the catalogs and the app, and is the largest; `runtime-create-*.js`
(525 kB) and `library-*.js` (98 kB) are loaded on demand by the Components
library and DOGFOOD. A document's text appears in the build once, in the DOGFOOD
chunk, and the 2.5 MB book corpus is not in it.

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

## DOGFOOD page

`examples/web-gpu/dogfood.html` is a third Rollup input beside `index.html` and
`dom.html`, and has no page chrome. Its React root renders one component,
`MountHost` with the `window` size (`h-dvh w-screen`), and `src/dogfood/boot.ts`
mounts DOGFOOD on it through the same session, atlas and presenters as the
showcase page, so the grid fills the window and follows a resize. `?backend=`
chooses the backend as on the showcase page, and `window.__bijouWebGpu` is the
same probe. `examples/web-gpu/e2e/dogfood.e2e.ts` opens the landing screen,
enters the guides, opens a guide, changes page and theme, resizes the window,
and opens every page, asserting no fault, no failure and no console error.

## Demo gallery

`examples/web-gpu/gallery.html` is a fourth Rollup input. The registry,
`src/gallery/demos.ts`, lists each demo with an id, a title, a one-line
description and a `load()` that imports the app on demand, so no demo's code is
in the entry chunk. DOGFOOD is the first entry, the soak bench the second, and the showcase page's app list
(`src/apps.ts`) spreads the registry, so a new entry is one object there.

The address chooses the page (`src/gallery/route.ts`):

| Address | Page |
| --- | --- |
| `gallery.html` | The gallery: one shadcn `Item` link per demo, with `Enter` and `l` hints. |
| `gallery.html?app=<id>` | That demo, full-window, with a Back button hinted `Esc`. Reloading opens the same demo. |
| `gallery.html?app=<unknown>` | The gallery with an Alert that names the unknown id, shown as text. |

Visits use `pushState`, so back and forward walk them. Only `?backend=` carries
from one address to the next. Leaving a demo stops its mount, disposes its atlas
and removes `window.__bijouWebGpu`, so no canvas, probe or listener stays behind.
A demo whose code fails to load shows its error in an Alert and leaves the Back
button working. `Esc` returns only while focus is in the chrome: while the
Surface has focus every key goes to the demo. The gallery also joins the header
and the palette as `Space` then `a`. The build writes a manifest
(`build.manifest`), which `tests/web-gpu/gallery-chunks.test.ts` reads.

## Soak bench demo

`?app=soak` runs the soak bench (`bench/src/soak-app.ts`): every display
scenario in turn on the canvas, with a frame-cost panel that the backtick key
toggles. The registry entry is `src/gallery/soak-demo.ts`. Its `load()` imports
`@bijou-examples/soak`, which `vite.config.ts` resolves to
`bench/src/soak-browser.ts` and `src/gallery/soak-app.d.ts` describes to the
showcase's `tsconfig.json`, so the bench is one on-demand chunk (24.3 kB before
compression in the production build) and no other chunk carries it.

The browser adapter of the bench's three host ports is `soak-browser.ts` and
`soak-query.ts`; neither names a Node API or a DOM type.

| Port | In the browser |
| --- | --- |
| Options | `cycles` (whole number, at least 1), `fps` (above 0, at most 240), `dwell` (seconds, above 0) and `scenario` (the id of the first scenario), read from the query when the demo loads. A repeated, empty, malformed or out-of-range value rejects the load with `BIJOU_SOAK_BAD_QUERY: <name> must be ..., got "<value>"`, which the page shows; nothing is defaulted. Other keys (`app`, `backend`) are the page's. Opening the demo from the gallery list carries only `?backend=`, so use the address to choose options. |
| Memory | `performance.memory.usedJSHeapSize` where Chrome offers it, as `heapUsedMB`. It is the JavaScript heap, not the resident set: `rssMB` is always `undefined`, and a missing, non-numeric, non-finite or zero reading is `undefined` too, so the panel and the log show no row and no field, never a zero. |
| Log | The last 200 lines, in memory, one per scenario. While the demo is open, `window.__bijouSoakLog()` returns a copy; leaving the demo removes it. The page shows no log text. |

The scenarios render with `createWebContext({ mode: 'interactive' })` from
`@flyingrobots/bijou-web`, a public context made of the browser runtime, clock,
style and output ports, built afresh for each `setup`. The Node adapter's
`createTestContext()` comes from `@flyingrobots/bijou/adapters/test`, which
pulls `vitest` and `path`, and is not in the page's graph.

What the numbers mean here: the panel's "FPS" is the inverse of the mean CPU
cost of a scenario frame, not presented frames
(flyingrobots/bijou#885). A browser's clock is coarser than Node's
(`performance.now()` is rounded, and more so without cross-origin isolation),
so short frame costs are quantized. Heap figures come from Chrome only. These
numbers say nothing about how the browser and Node compare.

`examples/web-gpu/e2e/gallery-soak.e2e.ts` runs one full cycle, the
address-chosen scenario, a refused value, a resize and ten opens and closes.

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
