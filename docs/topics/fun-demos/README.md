# bijou-fun demos

Reference for `examples/fun/`: the demo contract, the catalog, the shell, the single-demo app and the demos. Origin:
flyingrobots/bijou#888, for the two font demos flyingrobots/bijou#891, for the two fluid demos
flyingrobots/bijou#889, for the three 3D demos flyingrobots/bijou#890, and for the catalog and the single-demo app
flyingrobots/bijou#902.

## Contract

A demo is a `Demo<S>` (`examples/fun/contract.ts`): `init(seed)`, `update(msg, state)` and `view(state, frame)`, where
`view` returns a Surface. `defineDemo` turns it into a `DemoEntry`; `entry.mount(seed)` starts an immutable `Session`.

- Messages are `key`, `pointer` (column and row in the demo's own cells), `pointer-leave`, `pulse` (`dt` seconds) and
  `resize` (`width` and `height`, the pane in cells). The shell sends `resize` to every demo before the first pulse and
  again whenever the screen changes, so a demo that sizes a simulation from the pane keeps the size in its state; the
  others ignore it. A host that mounts a session itself sends the size the same way.
- A frame is the pane `width` and `height`, the `frame` count, the `elapsed` seconds and the context. The session
  advances `frame` and `elapsed` on each pulse that it forwards.
- `space` pauses and resumes any demo. While paused, pulses are dropped; keys and the pointer still reach the demo.
- A demo may take text: `captures(state)` says so. While it does, the session stops using `space` to pause, the shell
  sends the demo every key but `ctrl+c`, and a shifted letter arrives as `shift+<letter>`.
- Demos and shell modules import only public package entries and reach no Node API, no `Math.random`, no wall clock.
  Only `examples/fun/main.ts` does. Particles and blob speeds come from a seed.

## Catalog

`registry.ts` exports `catalog`: one entry per demo, in the order every host lists them. An entry has the demo's `id`,
`name` and one-line `description`, and `load(host)`, which imports that demo's module and returns its `DemoEntry`. The
catalog imports no demo module statically, so a list of demos can be shown before any demo's code has loaded, and a
bundler gives each demo a chunk of its own. The id, name and description repeat the demo's own; a test holds them equal.

`host` is `{ font }`, the font port. Only the two font demos use it. `loadDemos(host, entries = catalog)` loads every
entry in order and asks the host for the font once. It rejects if a module fails to load.

Adding a demo is its module, one entry in `catalog`, and that demo's own recorded frames (digests and a text frame
under `tests/fixtures/`). The id becomes the address `gallery.html?app=fun-<id>`, so it begins with a lower case
letter and holds only lower case letters, digits and hyphens. The terminal shell then lists the demo, and the showcase
gallery gives it a card and a page. For a demo that needs no font, no other file changes: the tests of the shell, the
gallery and the showcase run on fakes, or read the catalog or the page.

A demo that draws the font says so in its entry with `needsFont: true`, so that a host that must paint at once (the
showcase's landing page, which runs a random demo behind its wordmark) leaves it out. It also takes three more edits,
because the tests load every other demo with a font port that
rejects and give the font demos the real font apart: its id joins `FONT_IDS` in `tests/helpers/fun-demos.ts`, its
factory joins `fontDemos` in `tests/helpers/fun-font.ts`, and its digests go in
`tests/fixtures/examples-fun-font-goldens.ts`, not in `examples-fun-goldens.ts`. Without them the demo is tested
painting its missing-font message.

## Shell

`npm run fun` loads every demo of the catalog with `loadDemos` and hands them to the shell.
`createFunApp({ ctx, entries, seed })` returns an `App`. Row 0 lists the demos, the last row describes the active
demo and its keys, and the rows between are the demo's pane. `tab`, `right` and `left` switch (and wrap), a digit
jumps, `q` and `ctrl+c` quit, and other keys go to the demo. Each demo keeps its state while another is shown. A mouse
move or press inside the pane becomes a `pointer` message offset by the header row; outside it, a `pointer-leave`.
Other mouse actions are dropped.

## One demo alone

`createSoloApp({ ctx, entry, seed })` in `solo.ts` returns an `App` that runs one demo with nothing beside it, for a
page that shows a single demo. The demo's pane is every row but the last. The last row names the demo and its keys,
and shows `PAUSED` while it is paused. There is no list of demos and no key of the host's own: `tab`, the arrows, the
digits and `q` all reach the demo, and `ctrl+c` does nothing, since the page is how a person leaves. A mouse move or
press inside the pane becomes a `pointer` message in the pane's own cells, from row 0; on the last row or outside the
screen it is a `pointer-leave`. A resize tells the demo its new pane. A demo that throws in `view` is painted as
`<name> failed: <reason>` in the pane, and the last row stays.

## Demos

| Id | State | Keys |
| --- | --- | --- |
| `rainbow-gradient` | none | `space` |
| `wormhole` | 45 seeded particles and the render mode | `m` toggles braille and ascii |
| `metaballs` | five blobs bouncing in the unit square, and the pointer | pointer steers a sixth blob |
| `fluid` | up to 1,500 seeded particles in a fixed tank, the source side, the pour, a pending shake | `p` pour, `t` source side, `z` `x` `c` shake, `r` reset, `h` card |
| `flip-fluid` | a FLIP fluid (grid and up to 8,000 particles) in the same tank, and the obstacle | the fluid keys, and `w` `a` `s` `d` or `up` `down` move the obstacle |
| `raymarcher` | the light's place in the unit square | `w` `a` `s` `d` (or `up` and `down`) move the light |
| `raycaster` | the player, nine sprites, health, score, flash and shot counters, a pulse count | `w` `s` walk, `a` `d` turn, `f` or `p` shoot, `r` restarts |
| `raytracer` | the seed, the camera distance (1.5 to 10) and the pointer | pointer tilts the camera, `+` and `-` zoom |
| `font-renderer` | the message, whether it is taking text, whether the HUD shows | `i` types, `r` clears, `h` hides the HUD |
| `text-cylinder` | the same | the same; the message's words become four rolling lines |

### The fluid demos

Both keep their whole simulation in their state and replace it on every pulse, so a session never changes under another
(`FlipFluid.clone()` copies the grid and particles before a step). A pulse is one fixed step whatever its `dt`.
Pouring takes randomness from the seed (`random.ts`) in the state. State after N steps is a pure function of the seed,
the messages and the sizes.

The tank is the pane: a `resize` sets its width and height (never under 8 by 6), and an 80 by 22 tank stands in until
the first one arrives. As in the original, the particle fluid keeps its particles on a resize, since its walls only move
and the next step holds the particles inside them; the dam break starts again at the new size, as the original
rebuilt its grid whenever the pane no longer matched it, keeping the source side, the obstacle's position and the card.
A `view` painted in a pane of another size than the tank centres or crops it and never changes the state. The dam
break's buffer holds 8,000 particles, so a very large pane starts with fewer than a full block of water.

`p` pours for the next five pulses, so holding it, as key repeat does, keeps pouring. A shake waits for the next
pulse. The shell takes the digits and the left and right arrows, so the shake keys are `z`, `x`, `c` and the obstacle
moves with `w a s d` and `up` `down`; the particle cap of 1,500, the five-pulse pour and these keys are choices of the
port. Space pauses; the footer shows it.

### The 3D demos

Every 3D demo also answers `h`, which hides its heads-up panel. The raycaster's walking, its wall collision
(`canMoveTo`), the monsters and the shooting run in its own `update`, so they hold with no frame painted. The
raytracer draws lens jitter and soft-shadow samples from `random.ts`, seeded by the model's seed, the sub-pixel and
the frame; a frame is a pure function of the model. A paused session drops pulses, so the monsters and the
animation stop but a key still walks the player. The wheel is not a demo message, so the raytracer zooms on keys.
Frame cost at 177 by 53 is in [`examples/fun/README.md`](../../../examples/fun/README.md).

## The font demos

`font-renderer` fits the message's outlines to the pane and fills them at braille resolution in a travelling
rainbow; `text-cylinder` rolls four words over a cylinder under perspective. Both draw Space Mono Bold Italic
(`assets/fonts/space-mono`, SIL Open Font License 1.1, listed in `NOTICE`) parsed with `opentype.js`, a development
dependency of the repository and of no published package.

The font arrives through a port, never from a path the demo reads. `FontPort` is `() => Promise<ArrayBuffer | Uint8Array>`;
`loadTypeface(port)` parses it and returns a `Typeface` that is either ready or `missing` with a reason, and never
throws. `loadFontRenderer(port)` and `loadTextCylinder(port)` load the face and build each demo; the catalog's last
two entries call them. The terminal entry reads the file by a path from `main.ts`'s own module; the browser entry's
`fetchFont` fetches it by a URL from `browser.ts`'s own module. With a missing or unparseable font each demo paints
`Error: TTF Font file missing or failed to parse.` and the reason in its pane; the shell and the other demos work.

Typing, in the demo's own `update`: `i` or `enter` starts, printable keys and `space` add (at most 24 characters,
though a demo may start with a longer message), `backspace` deletes, `escape` finishes; `r` clears; `h` hides the HUD
card. The cylinder uses default words when the message has none. The HUD shows characters beyond printable ASCII as `?`.

## In the browser

`examples/fun/browser.ts` exports `loadSolo(item, seed, font = fetchFont)`. It loads one catalog entry's demo and
returns how to build the single-demo app around it. It imports no demo itself. The showcase gallery makes one entry
per catalog entry, at `?app=fun-<id>`, and each calls `loadSolo`, so a demo added to `catalog` gets a card and a page
with no showcase change, and opening one downloads that demo's chunk and no other demo's. The browser does not host
the shell: the gallery is the list of demos there. See the
[showcase reference](../web-gpu-showcase/README.md#demo-gallery).

If a demo's `view` throws, the shell and the single-demo app paint `<name> failed: <reason>` in the pane
(`shell-chrome.ts`). The shell keeps its header and footer, and its other demos keep running.

## Pointer limits

`main.ts` runs with `mouseMode: 'any'`, which the public `run` options provide, so pointer movement with no button
held reaches the metaballs. A terminal that does not report it leaves the blob where the last press or move put it. The browser canvas mount
delivers movement with no button held, but not a pointer leaving the canvas.
