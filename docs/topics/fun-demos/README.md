# bijou-fun demos

Reference for `examples/fun/`: the demo contract, the shell, and the demos that exist today. Origin:
flyingrobots/bijou#888.

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
| `fluid` | up to 1,500 seeded particles in a fixed tank, the source side, the pour, a pending shake | `p` pour, `t` source side, `z` `x` `c` shake, `r` reset, `h` card |
| `flip-fluid` | a FLIP fluid (grid and up to 8,000 particles) in the same tank, and the obstacle | the fluid keys, and `w` `a` `s` `d` or `up` `down` move the obstacle |

### The fluid demos

Both keep their whole simulation in their state and replace it on every pulse, so a session never changes under another
(`FlipFluid.clone()` copies the grid and particles before a step). A pulse is one fixed step whatever its `dt`.
Pouring takes randomness from the seed (`random.ts`) in the state. The tank is a fixed 80 by 22 cells
(`demos/tank.ts`): a pane of another size centres it, or crops it evenly, and a resize never touches the fluid.
`p` pours for the next five pulses, so holding it, as key repeat does, keeps pouring. A shake waits for the next
pulse. The shell takes the digits and the left and right arrows, so the shake keys are `z`, `x`, `c` and the obstacle
moves with `w a s d` and `up` `down`. Space pauses; the footer shows it.

## In the browser

`examples/fun/browser.ts` exports `funBuild(seed, entries = demos)`, which builds the shell for a page that hosts it;
the showcase gallery's `fun` entry uses it, so a demo added to `registry.ts` appears there with no showcase change.
If a demo's `view` throws, the shell paints `<name> failed: <reason>` in the pane (`shell-chrome.ts`), keeps the
header and footer, and the other demos keep running.

## Pointer limits

`main.ts` runs with `mouseMode: 'any'`, which the public `run` options provide, so pointer movement with no button
held reaches the metaballs. A terminal that does not report it leaves the blob where the last press or move put it. The browser canvas mount
delivers movement with no button held, but not a pointer leaving the canvas.
