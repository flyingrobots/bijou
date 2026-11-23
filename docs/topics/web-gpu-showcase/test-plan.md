# Test plan: web GPU showcase

This ledger lists each requirement of the [web GPU showcase](./README.md),
the test that holds it, where it runs, and its status. A name with `%s` is one
parameterized test.

Sealed tests are in `tests/web-gpu/` and run in the sealed runner with the
rest of `npm run test:run`. Browser tests are in `examples/web-gpu/e2e/` and
run with `npm run test:browser:web-gpu` in Google Chrome, outside the seal.

## Offline Geordi pin: `tests/web-gpu/geordi-pin.test.ts` (sealed)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-01 | The pin names one full Geordi commit. | `names one full Geordi commit` | Implemented |
| WGPU-02 | The pin lists the core and bijou-gpu packages. | `pins both packed packages, core and bijou-gpu` | Implemented |
| WGPU-03 | Each tarball has the SHA-256 the pin records. | `%s tarball matches its recorded SHA-256` | Implemented |
| WGPU-04 | The vendored procedural glyph table has the SHA-256 the pin records. | `%s matches its recorded SHA-256` | Implemented |
| WGPU-05 | The manifest and lockfile resolve each package from its tarball, with matching npm integrity. | `%s resolves from the vendored tarball with npm integrity` | Implemented |
| WGPU-23 | Every pinned file is `-text` in `.gitattributes`, so a CRLF checkout keeps its bytes. | `keeps every pinned file byte-exact on checkout through .gitattributes` | Implemented |
| WGPU-06 | The sealed dependency worker receives the lockfile's repository tarballs, and refuses a path outside the repository or with a backslash. | `lists the vendored Geordi tarballs the lockfile resolves`, `refuses %s` in `scripts/docker-seal/local-tarballs.test.ts` | Implemented |

## No Node built-in: `tests/web-gpu/node-imports.test.ts` (sealed)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-07 | The page builds with no Node built-in. | `builds the showcase page with no refusal` | Implemented |
| WGPU-08 | Each app module the showcase mounts (counter's unmodified entry, the Components library, hero and its browser memory adapter, the component showcase) builds with no Node built-in. | `builds the %s app module %s with no refusal` | Implemented |
| WGPU-09 | The showcase lists counter, components, hero and showcase, and refuses none. | `lists every example app it mounts and refuses none` | Implemented |
| WGPU-10 | A direct Node built-in import is refused and the importer named. | `refuses a direct import of a Node built-in and names the importer` | Implemented |

## Host-free example apps: `tests/web-gpu/app-host-reach.test.ts`, `tests/web-gpu/app-cell-widths.test.ts` and others (sealed)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-24 | The import-graph walk finds a Node built-in behind two re-exports and a dynamic import, and free `process` and `Buffer` uses, and nothing for a shadowing parameter or a property name. | `finds a built-in behind two re-exports and host globals, and nothing in a shadow or a property name` | Implemented |
| WGPU-25 | The counter, showcase, components and hero app modules, and hero's perf tracker, reach no Node built-in and no `process` or `Buffer`. | `%s (%s) reaches none` | Implemented |
| WGPU-26 | The Components library and the hero app paint the same styled terminal frames as before their data moved to imports. | `the library title, a component with its docs and snippet, and the end slide`, `the hero reel from the melt-in title through the render lab, with a fixed perf sample` in `tests/examples-terminal-frames.test.ts` | Implemented |
| WGPU-27 | The generated Components library data matches its sources, and the check names a drifted, a missing and a stray copy. | `matches what its sources give now`, `names a copy that drifted, a missing one and a stray one` in `tests/components-browser-data.test.ts` | Implemented |
| WGPU-28 | The DOGFOOD catalog import table lists every catalog file of every locale; each call returns its own copy; an unknown locale is refused. | `import every catalog file of every locale, and nothing else`, `give each call its own copy, and refuse a locale with no catalogs` in `tests/dogfood-catalog-imports.test.ts` | Implemented |
| WGPU-29 | The host-free base64 decoder accepts and refuses exactly the texts that `Buffer` round-trips. | `decodes what Buffer encodes, for every length from 0 to 64 bytes`, `refuses %j as Buffer does`, `agrees with Buffer on random texts over the alphabet and padding` in `tests/examples-base64.test.ts` | Implemented |
| WGPU-30 | No Components library slide, in any output mode, and no frame of the hero reel holds a width-2 grapheme or is an unpacked Surface. | `every Components library slide, with its info, in each output mode`, `the whole hero reel, with the palette open and a theme switch` | Implemented |

## CI lanes: `tests/web-gpu/ci-browser-job.test.ts` (sealed)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-11 | The browser job runs only `npm ci` and the browser suite outside the seal. | `runs only npm ci and the browser suite outside the seal` | Implemented |
| WGPU-12 | The sealed test job builds and typechecks the page. | `builds and typechecks the showcase inside the sealed runner` | Implemented |

## Golden lifecycle: `examples/web-gpu/e2e/golden.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-13 | The counter loads on forced WebGL2; the HUD reports backend, no fallback, grid, cell, a probed evidence level and frame time; the grid matches the canvas box. An empty cell is exactly `#0D1117`; the digit and the label have ink. A key press makes the count 1 and changes the digit's pixels only. A switch to Canvas 2D replaces the canvas, keeps one canvas and one textarea, keeps the count, keeps focus, shows the same digit pixels and the same `frameRgbaSha256`, and takes the next key. Then components and hero mount in turn (counter -> components -> hero), each presenting with no problem, one canvas and one textarea; unmount leaves nothing; no console or page error. | `counter on WebGL2 takes a key, keeps its state across a switch to Canvas 2D, then components and hero mount and it unmounts` | Implemented |
| WGPU-14 | The HUD lists the four apps and no refused app. | `the HUD lists no example app as refused: every one bundles for the browser` | Implemented |

## Hostile events and edges: `examples/web-gpu/e2e/hostile.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-15 | With no WebGPU adapter and no WebGL2 context, `auto` mounts Canvas 2D and the HUD names both fallback reasons. | `with no WebGPU adapter and no WebGL2 context, auto falls back to Canvas 2D and the HUD names both reasons` | Implemented |
| WGPU-16 | `WEBGL_lose_context` loses and restores the context; the presenter redraws the same pixels without an app frame, and later frames read back as before. | `a WEBGL_lose_context loss and restore redraws the same frame without the app` | Implemented |
| WGPU-17 | A viewport resize changes the grid the HUD reports, to the canvas box divided by the cell. | `resizing the viewport changes the grid the HUD reports` | Implemented |
| WGPU-18 | An atlas reset starts a new generation and the frame reads back as before. | `a forced glyph atlas reset starts a new generation and redraws the same pixels` | Implemented |
| WGPU-22 | With spare pixels past the last whole cell, the probe reads each cell at the mount's cell size. | `the cell probe reads at the mount cell size when the canvas has spare pixels` | Implemented |

## Stress: `examples/web-gpu/e2e/stress.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-19 | Ten rounds of toggles across counter, components and hero and two backends, fired without waiting, leave one canvas and one textarea, at most three nodes at any sample, a healthy HUD on hero, no failed operation in the retained history, and no error. | `ten rapid toggles of three apps and two backends leave one canvas, one textarea and no error` | Implemented |

## WebGPU: `examples/web-gpu/e2e/webgpu.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-20 | Where Chrome exposes a WebGPU adapter, the counter on WebGPU gives a probed receipt with the same `frameRgbaSha256` as WebGL2 and takes a key. Ten rounds of switches during HUD readbacks leave no failed operation, no HUD refresh error and no page error. Without an adapter the case is skipped as capability-refused. | `counter on WebGPU draws the same frame as WebGL2 and takes a key` | Implemented |

## DOM host check: `examples/web-gpu/e2e/dom.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-21 | `dom.html` mounts a semantic scene app with `mountBijouDom()`; the case is DOM-27 of the [DOM host test plan](../bijou-web-dom/test-plan.md). | `mountBijouDom() in Chromium: one dispatch per activation, and typing or composing keeps the input element, focus and selection` | Implemented |
