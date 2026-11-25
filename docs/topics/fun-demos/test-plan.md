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

## 3D demos: `examples-fun-3d.test.ts`, `examples-fun-raycaster.test.ts`

Origin: flyingrobots/bijou#890. The frame digests of the raymarcher, the raycaster and the raytracer are in the same fixture, and their 80x24 text frames are `tests/fixtures/examples-fun/frames/<id>-80x24.txt` (FD-02 and the frames test cover them).

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-40 | The registry lists the three 3D demos. | `the registry lists the raymarcher, the raycaster and the raytracer` | Implemented |
| FD-41 | A one-row pane paints at several widths. | `<id> paints a one-row pane at several widths` | Implemented |
| FD-42 | A frame is a pure function of the model: painting twice gives the same cells. | `<id> paints the same frame twice from the same state` | Implemented |
| FD-43 | `h` hides the heads-up panel and a second `h` restores it. | `<id> h hides the heads-up panel and a second h brings it back` | Implemented |
| FD-44 | The raymarcher light follows `w`, `s`, `a`, `d` and stops at the edge of the unit square. | `the raymarcher light follows w, s, a and d and stops at the edge of the unit square`, `the raymarcher paints a different frame once the light has moved` | Implemented |
| FD-45 | The raytracer camera distance stops at 1.5 and 10, on keys. | `the raytracer camera distance stops at both limits, on keys` | Implemented |
| FD-46 | The raytracer's dithering depends on the seed and on nothing else. | `the raytracer dithering depends on the seed and on nothing else` | Implemented |
| FD-47 | The raytracer tilts with the pointer and keeps the tilt on leave. | `the raytracer tilts with the pointer and keeps the tilt when the pointer leaves` | Implemented |
| FD-50 | The raycaster starts where the original did. | `starts at 3.5, 3.5 facing a quarter pi with full health` | Implemented |
| FD-51 | A scripted walk ends at a known position. | `a scripted walk ends at a known position: three steps, a turn of two, three more` | Implemented |
| FD-52 | Walking into a wall stops at the wall; walking along one slides. | `walking into a wall stops at the wall and the player never stands inside it`, `walking along a wall slides instead of stopping dead` | Implemented |
| FD-53 | Collision lives in `update`: it holds with no frame painted. | `collision holds with no frame ever painted, and w and s walk the same line` | Implemented |
| FD-54 | A seeded walk of 2,000 steps never enters a wall. | `a seeded walk of 2,000 steps never enters a wall and never leaves the map` | Implemented |
| FD-55 | A shot in the firing cone kills a monster in two hits; a shot at nothing hurts nobody; `r` restarts. | `shoots a monster in the firing cone dead in two shots and scores 150`, `a shot at nothing hurts nobody, and r restarts the level` | Implemented |
| FD-56 | Treasure scores 250; a touching monster bites. | `collects treasure for 250 points and takes damage from a monster that touches the player` | Implemented |

