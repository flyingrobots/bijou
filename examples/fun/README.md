# bijou-fun demos

Animated Surface demos behind one typed contract and a small shell: a rainbow gradient, a wormhole, colour-blending
metaballs, and three 3D demos (a raymarcher, a raycaster game and a raytracer). They come from the owner's bijou-fun project, written against Bijou 7.1 and ported here.

## Run

```sh
npm run fun
```

| Key | Does |
| --- | --- |
| `tab`, `right`, `left`, `1` to `6` | switch demo (the arrow keys switch demos, so the 3D demos turn on `a` and `d`) |
| `space` | pause and resume the demo |
| `m` | wormhole: braille or ascii |
| pointer | metaballs: steer one blob (the terminal reports movement with no button held) |
| `w`, `a`, `s`, `d` | raymarcher: move the light |
| `w`, `s`, `a`, `d`, `f`, `r` | raycaster: walk, turn, shoot, restart the level |
| pointer, `+`, `-` | raytracer: tilt the camera, zoom in and out |
| `h` | 3D demos: hide the heads-up panel |
| `q`, `ctrl+c` | quit |

## The contract

`contract.ts` is the contract. A demo is a `Demo<S>`: `init(seed)` makes its state, `update(msg, state)` takes a
`DemoMsg` (a key, a pointer position in the demo's own cells, a pointer leaving, a pulse), and `view(state, frame)`
returns a Surface from the pane size, a frame number and the elapsed seconds. There is no shared options bag: the
metaballs keep their blobs and pointer in their own state, the wormhole its particles and render mode. A demo never
reads the clock or `Math.random`; a seed (`random.ts`) and the pulses `dt` drive everything, so a frame at a given
size, seed and message list is reproducible.

`defineDemo` erases the state type into a `DemoEntry`, and `mount(seed)` starts a `Session`. A session owns the
frame count and the pause, so every demo pauses the same way.

## Files

- `contract.ts`, `random.ts`, `panel.ts` (card and braille helpers): the shared parts.
- `shell.ts`, `shell-chrome.ts`: the header row, the footer row, input routing.
- `registry.ts`: the list of demos. `demos/`: one file per demo, split where a demo needs more than one.
- `browser.ts`: the browser entry, `funBuild(seed, entries)`; the showcase gallery loads it.
- `main.ts`: the terminal entry. It is the only file that reaches Node, so the rest can run in a browser.

## The 3D demos

`demos/raymarcher*.ts`, `demos/raycaster*.ts` and `demos/raytracer*.ts` are ported from bijou-fun with the rendering
maths moved as it was. The raycaster keeps the player, the level's sprites, health and score in its model; `update`
walks, turns, tests `canMoveTo` (the collision, in `raycaster-map.ts`), fires and moves the monsters on each pulse.
The raytracer keeps its seed, camera distance and pointer in its model; the lens jitter and soft-shadow samples come
from `random.ts` through `raytracer-sampler.ts`, seeded from the model's seed, the sub-pixel and the frame.

Two controls differ from the original because the shell speaks no scroll wheel and no mouse button: the raytracer
zooms on `+` and `-` (the original used the wheel), and the raycaster shoots on `f` or `p` only (the original also
shot on a left click and walked on the wheel). The shell keeps the arrow keys for switching demos, so the raycaster
and the raymarcher answer `up` and `down` and use `a` and `d` to turn and to move sideways.

### Frame cost at 177 by 53

Median time of one `view` call at 177 by 53 cells, after 30 pulses, over 15 calls. Measured on 2026-11-24 on an
Apple M5 inside the sealed Linux test container, Node v22.23.4. These are one machine's numbers, recorded so a later
change can be compared; nothing gates on them.

| Demo | Median | Fastest | Slowest |
| --- | --- | --- | --- |
| `raymarcher` | 14.6 ms | 14.0 ms | 26.3 ms |
| `raycaster` | 8.6 ms | 8.2 ms | 12.4 ms |
| `raytracer` | 76.6 ms | 75.3 ms | 89.4 ms |

Adding a demo is a `Demo<S>` in `demos/` and one line in `registry.ts`.

See the [reference](../../docs/topics/fun-demos/README.md) for behaviour and its [test plan](../../docs/topics/fun-demos/test-plan.md).

[← Examples](../README.md)
