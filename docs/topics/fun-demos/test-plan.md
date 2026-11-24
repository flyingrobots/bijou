# Test plan: bijou-fun demos

Requirements of the [fun demos reference](./README.md) and the tests that hold them, all under `tests/`. The frame
digests are in `tests/fixtures/examples-fun-goldens.ts`: sha256 of every cell at a fixed size, seed 1888, and 60
pulses of 1/30 s. Origin: flyingrobots/bijou#888.

## Frames: `examples-fun-demos.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-01 | The registry lists the three demos in order. | `the registry lists the three ported demos in order` | Implemented |
| FD-02 | Each demo's frames at 80x24 and 177x53 match the recorded digests. | `<id> paints its recorded frames at 80x24`, `<id> paints its recorded frames at 177x53` | Implemented |
| FD-03 | The same seed and messages give the same frame. | `<id> repeats itself: the same seed and messages give the same frame` | Implemented |
| FD-04 | The wormhole particles depend on the seed. | `the wormhole particles depend on the seed` | Implemented |

## Edges and stress: `examples-fun-edges.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-10 | A one-cell pane paints without throwing. | `<id> paints a one-cell pane without throwing` | Implemented |
| FD-11 | A paused session stands still and moves on resume. | `<id> stands still while paused and moves again on resume` | Implemented |
| FD-12 | The metaballs ignore a pointer outside the pane and drop it on leave. | `the metaballs ignore a pointer outside the pane` | Implemented |
| FD-13 | The wormhole toggles braille and ascii on `m`. | `the wormhole toggles between braille and ascii on m` | Implemented |
| FD-14 | 1,000 pulses with seeded pointer moves neither throw nor grow the heap without bound. | `<id> neither throws nor grows the heap without bound` | Implemented |

## Shell: `examples-fun-shell.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-20 | The header lists every demo; the footer describes the active one. | `lists every demo in the header and starts on the first` | Implemented |
| FD-21 | Tab, the arrows and digits switch and wrap. | `switches demos with tab, shift-less arrows and digits, and wraps` | Implemented |
| FD-22 | `q` quits. | `asks the runtime to quit on q` | Implemented |
| FD-23 | The demo fills the screen between the header and footer. | `draws the demo into the body between the header and the footer` | Implemented |
| FD-24 | Moves in the pane become pointer messages; outside, header, footer and the wheel do not. | `turns mouse moves in the body into pointer messages offset by the header, and moves outside into a leave` | Implemented |
| FD-25 | A demo keeps its state across a switch. | `keeps each demo state when switching away and back` | Implemented |

## Reach: `examples-fun-reach.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-30 | The tree has the entry, the contract, the shell and three demos. | `has the terminal entry and at least the contract, the shell and three demos` | Implemented |
| FD-31 | No file imports a package internal path. | `imports no package internal path, in any file` | Implemented |
| FD-32 | Only `main.ts` reaches Node, the clock or `Math.random`. | `reaches no Node API outside the terminal entry` | Implemented |

## Browser seam and failure: `web-gpu/gallery-fun.test.ts`, `examples-fun-throw.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-33 | `funBuild` builds the shell from the registry or from the entries it is given. | `shows a demo registered in the fun registry, reached by key and pointer, with no change under examples/web-gpu` | Implemented |
| FD-34 | A demo that throws in `view` is painted as a failure; header, footer and other demos work. | `paints the failure in the pane and keeps the header and footer`, `lets the reader switch to a demo that works` | Implemented |
