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
| WGPU-04 | The pin lists no file besides the two tarballs, and `vendor/` holds nothing else, so no glyph table is vendored. | `pins no file besides the two tarballs, and vendors nothing else` | Implemented |
| WGPU-05 | The manifest and lockfile resolve each package from its tarball, with matching npm integrity. | `%s resolves from the vendored tarball with npm integrity` | Implemented |
| WGPU-23 | Every pinned tarball is `-text` in `.gitattributes`, so a CRLF checkout keeps its bytes. | `keeps every pinned file byte-exact on checkout through .gitattributes` | Implemented |
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

## Chrome sources: `tests/web-gpu/chrome-sources.test.ts` and `tests/web-gpu/chrome-registry.test.ts` (sealed)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-24 | Every chrome `.tsx` outside the CLI-installed `src/vendor/` and `src/components/` has no intrinsic element but layout-only `div`s, the page `h1`, `a` links and the mount host; no inline style, raw colour, arbitrary Tailwind value, palette colour or primitive imported past the shadcn components. | `has chrome sources to scan`, `%s has no hand-authored markup, inline style or raw colour` | Implemented |
| WGPU-25 | One component declares the Bijou mount host, and it has no children. | `declares the Bijou mount host in one component, with no children of its own` | Implemented |
| WGPU-26 | Each HTML entry holds only a root element and its module script. | `keeps each HTML entry to a root element and its module script` | Implemented |
| WGPU-27 | `components.json` installs from the `@flyingrobots` registry into `src/vendor/` and `src/components/`, and the README names every installed item. | `installs from the @flyingrobots registry into src/vendor and src/components`, `names every installed registry item in the README` | Implemented |
| WGPU-28 | `src/index.css` declares only shadcn tokens, every light and dark token has a value, and the theme-book command is recorded; `src/showcase.css` is gone. | `declares only shadcn tokens in its one stylesheet`, `gives every light and dark token a value from theme-book, and records the command` | Implemented |
| WGPU-40 | Every file under `src/vendor/` and `src/components/` has the SHA-256 `registry-files.json` records for it as the shadcn CLI installed it, and the record lists no other file. The seal cannot reach the registry; reinstalling with the CLI (showcase README) is what ties the record to it. | `keeps every CLI-installed file byte for byte as registry-files.json records it, and records nothing else` | Implemented |
| WGPU-29 | One boundary rule keeps chrome styles out of the Bijou mounts. | `keeps the chrome styles out of the Bijou mounts with one boundary rule` | Implemented |

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

## Chrome: `examples/web-gpu/e2e/chrome.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-30 | The theme follows the system by default; light and dark apply and persist across a reload; system follows the emulated scheme. | `the theme follows the system by default, switches to light or dark, and keeps the choice across a reload` | Implemented |
| WGPU-31 | At 390 px the regions stack with no horizontal scroll and the grid fits the canvas. | `at phone width the regions stack in one column with no horizontal scroll, and the grid fits the canvas` | Implemented |
| WGPU-32 | At 2560 px the Surface, the controls and the HUD sit side by side across the width. | `on an extra-wide screen the Surface, the controls and the HUD sit side by side across the width` | Implemented |
| WGPU-33 | With WebGPU and WebGL2 unavailable, both fallback reasons are shown in an Alert. | `with no WebGPU adapter and no WebGL2 context the fallback reasons are shown in an alert` | Implemented |

## Keys: `examples/web-gpu/e2e/keys.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-34 | With the Surface focused, `Esc`, `Space`, `h` `j` `k` `l`, the arrows and `t` all reach the textarea, the count follows the counter's own keys, and no palette or menu opens. | `with the Surface focused, every key reaches the Bijou app and none opens the page chrome` | Implemented |
| WGPU-35 | In the chrome, `Esc` opens the palette, a typed command runs, and the Keys card shows `Kbd` hints. | `in the chrome, Esc opens the command palette, its commands run, and the hints name the keys` | Implemented |
| WGPU-36 | In the chrome, `j` and `k` move focus, and `Space` then `t` opens the theme menu. | `in the chrome, j and k move focus through the controls and Space then t opens the theme menu` | Implemented |
| WGPU-37 | On the DOM page, keys typed into a mounted input, and `Esc`, `j`, `k` and `Space` on a mounted Button, reach the element; Space presses it once and the page acts on none. | `on the DOM check page, keys typed into a mounted input stay in the input`, `on the DOM check page, a focused mounted Button gets Esc, j, k and Space, and the page acts on none of them` | Implemented |

## Style isolation: `examples/web-gpu/e2e/isolation.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-38 | The canvas and textarea a mount creates have the computed non-inherited styles of the same elements in a document with no author CSS, and the canvas fills the host's content box. | `no chrome style reaches the canvas or the textarea mountBijouCanvas() creates` | Implemented |
| WGPU-39 | Every element `mountBijouDom()` creates has the computed non-inherited styles of the same element in a document with no author CSS. | `no chrome style reaches the elements mountBijouDom() creates` | Implemented |

## Host switch: `examples/web-gpu/e2e/host.e2e.ts`, `host-stress.e2e.ts` (browser), `tests/web-gpu/host-handoff.test.ts`, `dual-app.test.ts` (sealed)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-41 | A count set to 5 on the canvas host is 5 on the DOM host, takes an increment there, and is 6 back on the canvas, whose frame equals a fresh mount counted to 6. One mount exists after each switch. | `the dual-host counter set to 5 on the canvas shows 5 on the DOM host, takes an increment there, and the canvas then shows 6` | Implemented |
| WGPU-42 | A presenter switch after a host round trip keeps the state, the backend toggle is disabled on the DOM host, and the canvas returns on the backend it left. | `a presenter switch after a host round trip keeps the state, and the canvas comes back on the backend it left` | Implemented |
| WGPU-43 | An app with no scene projection has a disabled DOM item, a HUD row and a note that say why, `Space` then `m` does nothing, and a direct request is refused with `BIJOU_WEB_GPU_NO_SCENE` and changes nothing. | `an app without a scene projection offers no DOM host, and the HUD and the controls say why` | Implemented |
| WGPU-44 | A seeded walk of 36 host switches, presenter switches and inputs keeps one count, with one mount after every step. The seed is logged and set by `BIJOU_HOST_STRESS_SEED`. | `a seeded walk of 36 host switches, presenter switches and inputs keeps one count` | Implemented |
| WGPU-45 | The handoff wrapper starts from the carried model, runs neither the app's init nor its commands, keeps every other member, and leaves the handed object unchanged. | `starts from the carried model and runs neither the app init nor its commands`, `keeps every other member of the app, so both projections and the update are the same functions`, `carries on from the handed model: the next action updates it, and the handed object is left as it was` | Implemented |
| WGPU-46 | The dual-host counter's scene has `group` and `text` nodes only with an action per control, its Surface is packed with width-1 cells only, and it takes both the counter keys and the scene actions. | `lowers to group and text nodes only, and declares an action for each control`, `paints a name the canvas cannot hold with one cell per grapheme, and the scene keeps it whole`, `takes the counter keys and t as key messages`, `takes the scene actions through the controller: increment, decrement, rename and toggle` | Implemented |
| WGPU-47 | When the new host cannot start, the previous host is started again with the same model. | Not yet tested: no host failure can be provoked from the page without a test seam. | Planned |


## Gallery: `tests/web-gpu/gallery-registry.test.ts`, `gallery-chunks.test.ts` (sealed), `examples/web-gpu/e2e/gallery*.e2e.ts` (browser)

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-48 | The registry lists DOGFOOD first, each demo with an id, title, one-line description and loader, and ids are unique. | `lists DOGFOOD first, each demo with an id, a title and a one-line description`, `has unique ids` | Implemented |
| WGPU-49 | The route is the gallery, a registered demo, or the gallery with the unknown id; addresses keep only the backend. | `is the gallery with no app, and an empty app`, `is a registered demo for its id, whatever else the address holds`, `is the gallery with the unknown id, which is only ever shown as text`, `makes an address for a demo or the gallery that keeps the backend choice and nothing else` | Implemented |
| WGPU-50 | The gallery lists every demo and opens DOGFOOD at its URL; return works and a reload opens the same demo. | `the gallery lists every registered demo, opens DOGFOOD at its URL, returns, and a reload of the URL opens the same demo` | Implemented |
| WGPU-51 | A production build puts each demo in its own chunk, outside the entry chunk and its static imports, read from the manifest. | `names a module for every registered demo`, `puts each demo in a chunk of its own that is loaded on demand`, `keeps every demo out of the gallery entry chunk and the chunks it imports` | Implemented |
| WGPU-52 | An unknown `?app=` shows the gallery with a message naming it. | `an unknown app shows the gallery with a message that names it` | Implemented |
| WGPU-53 | A demo whose chunk cannot load shows the error in the page and the gallery stays usable. | `a demo whose code cannot load shows the error in the page, and the gallery stays usable` | Implemented |
| WGPU-54 | Back and forward move between gallery and demo, leaving one canvas or none. | `the back and forward buttons move between the gallery and the demo, leaving one canvas or none` | Implemented |
| WGPU-55 | In light and dark the gallery takes `l`, `Enter` and `Esc`; the theme menu switches themes. | `in the %s theme the gallery moves focus with l, opens a demo with Enter, and Esc opens the palette`, `the gallery switches between light and dark from its theme menu` | Implemented |
| WGPU-56 | In a demo `Esc` returns from the chrome, and a focused Surface keeps every key. | `in a demo, the Esc key hint and the button return to the gallery from the chrome, and a focused Surface keeps every key` | Implemented |
| WGPU-57 | Opening and closing DOGFOOD 50 times leaves one canvas while open, none after, and a stable listener count. | `opening and closing DOGFOOD 50 times leaves one canvas while open, none after, and a stable listener count` | Implemented |

## Fun demos in the gallery: `tests/web-gpu/gallery-fun.test.ts` (sealed), `examples/web-gpu/e2e/gallery-fun*.e2e.ts` (browser)

Origin: flyingrobots/bijou#892. IDs start at 70 to leave 58 to 69 to parallel work.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| WGPU-70 | The registry lists the fun shell after DOGFOOD and loads it on demand. | `lists the fun shell after DOGFOOD, as one entry`, `loads the shell on demand, and its header lists every demo of the fun registry` | Implemented |
| WGPU-71 | A demo registered in the fun shell appears, by key and pointer, with no change under `examples/web-gpu`. | `shows a demo registered in the fun registry, reached by key and pointer, with no change under examples/web-gpu`, `names no fun demo anywhere in the showcase source` | Implemented |
| WGPU-72 | The fun chunk is dynamic and outside the entry chunk. | `puts each demo in a chunk of its own that is loaded on demand`, `keeps every demo out of the gallery entry chunk and the chunks it imports` | Implemented |
| WGPU-73 | On WebGPU and on Canvas 2D each demo opens, advances and logs no console error. | `on webgpu each fun demo opens, advances with the clock and the keys, and the console stays clean`, `on canvas2d each fun demo opens, advances with the clock and the keys, and the console stays clean` | Implemented |
| WGPU-74 | The metaballs follow a pointer with no button held, by cell, at device scale 1 and 2 on both backends, and let go in the header row. | `the metaballs follow a pointer with no button held, by cell, and let go in the header row` | Implemented |
| WGPU-75 | The gallery lists the fun shell and opens it; leaving it leaves no canvas. | `the gallery lists the fun shell and opens it by click`, `leaving the fun shell returns to the gallery with no canvas left` | Implemented |
| WGPU-76 | A backend switch keeps the shell on the same demo, still advancing. | `a backend switch while a demo runs keeps the shell on the same demo, still advancing` | Implemented |
| WGPU-77 | 100 demo switches leave one canvas and a stable listener count. | `switching demos 100 times leaves one canvas and a stable listener count` | Implemented |
| WGPU-78 | A pointer leaving the canvas is not delivered by the canvas mount. | None: documented limit of `bijou-web`, which binds no `pointerleave`. | Not covered |
