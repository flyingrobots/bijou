# bijou-fun demos

Reference for `examples/fun/`: the demo contract, the shell, and the demos that exist today. Origin:
flyingrobots/bijou#888, and flyingrobots/bijou#890 for the 3D demos.

## Contract

A demo is a `Demo<S>` (`examples/fun/contract.ts`): `init(seed)`, `update(msg, state)` and `view(state, frame)`, where
`view` returns a Surface. `defineDemo` turns it into a `DemoEntry`; `entry.mount(seed)` starts an immutable `Session`.

- Messages are `key`, `pointer` (column and row in the demo's own cells), `pointer-leave` and `pulse` (`dt` seconds).
- A frame is the pane `width` and `height`, the `frame` count, the `elapsed` seconds and the context. The session
  advances `frame` and `elapsed` on each pulse that it forwards.
- `space` pauses and resumes any demo. While paused, pulses are dropped; keys and the pointer still reach the demo.
- Demos and shell modules import only public package entries and reach no Node API, no `Math.random`, no wall clock.
  Only `examples/fun/main.ts` does. Particles and blob speeds come from a seed.

## Shell

`createFunApp({ ctx, entries, seed })` returns an `App`. Row 0 lists the demos, the last row describes the active
demo and its keys, and the rows between are the demo's pane. `tab`, `right` and `left` switch (and wrap), a digit
jumps, `q` and `ctrl+c` quit, and other keys go to the demo. Each demo keeps its state while another is shown. A mouse
move or press inside the pane becomes a `pointer` message offset by the header row; outside it, a `pointer-leave`.
Other mouse actions are dropped.

## Demos

| Id | State | Keys |
| --- | --- | --- |
| `rainbow-gradient` | none | `space` |
| `wormhole` | 45 seeded particles and the render mode | `m` toggles braille and ascii |
| `metaballs` | five blobs bouncing in the unit square, and the pointer | pointer steers a sixth blob |
| `raymarcher` | the light's place in the unit square | `w` `a` `s` `d` (or `up` and `down`) move the light |
| `raycaster` | the player, nine sprites, health, score, flash and shot counters, a pulse count | `w` `s` walk, `a` `d` turn, `f` or `p` shoot, `r` restarts |
| `raytracer` | the seed, the camera distance (1.5 to 10) and the pointer | pointer tilts the camera, `+` and `-` zoom |

Every 3D demo also answers `h`, which hides its heads-up panel. The raycaster's walking, its wall collision
(`canMoveTo`), the monsters and the shooting run in its own `update`, so they hold with no frame painted. The
raytracer draws lens jitter and soft-shadow samples from `random.ts`, seeded by the model's seed, the sub-pixel and
the frame; a frame is a pure function of the model. A paused session drops pulses, so the monsters and the
animation stop but a key still walks the player. The wheel is not a demo message, so the raytracer zooms on keys.
Frame cost at 177 by 53 is in [`examples/fun/README.md`](../../../examples/fun/README.md).

## In the browser

`examples/fun/browser.ts` exports `funBuild(seed, entries = demos)`, which builds the shell for a page that hosts it;
the showcase gallery's `fun` entry uses it, so a demo added to `registry.ts` appears there with no showcase change.
If a demo's `view` throws, the shell paints `<name> failed: <reason>` in the pane (`shell-chrome.ts`), keeps the
header and footer, and the other demos keep running.

## Pointer limits

`main.ts` runs with `mouseMode: 'any'`, which the public `run` options provide, so pointer movement with no button
held reaches the metaballs. A terminal that does not report it leaves the blob where the last press or move put it. The browser canvas mount
delivers movement with no button held, but not a pointer leaving the canvas.
