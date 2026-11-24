# bijou-fun demos

Three animated Surface demos behind one typed contract and a small shell: a rainbow gradient, a wormhole and
colour-blending metaballs. They come from the owner's bijou-fun project, written against Bijou 7.1 and ported here.

## Run

```sh
npm run fun
```

| Key | Does |
| --- | --- |
| `tab`, `right`, `left`, `1` to `3` | switch demo |
| `space` | pause and resume the demo |
| `m` | wormhole: braille or ascii |
| pointer | metaballs: steer one blob (the terminal reports movement with no button held) |
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

Adding a demo is a `Demo<S>` in `demos/` and one line in `registry.ts`.

See the [reference](../../docs/topics/fun-demos/README.md) for behaviour and its [test plan](../../docs/topics/fun-demos/test-plan.md).

[← Examples](../README.md)
