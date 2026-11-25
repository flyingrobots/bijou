# Test plan: bijou-fun demos

Requirements of the [fun demos reference](./README.md) and the tests that hold them, all under `tests/`. The frame
digests are in `tests/fixtures/examples-fun-goldens.ts`: sha256 of every cell at a fixed size, seed 1888, and 60
pulses of 1/30 s. Origin: flyingrobots/bijou#888.

## Frames: `examples-fun-demos.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-01 | The registry lists the three demos ported first. | `the registry lists the three demos ported first` | Implemented |
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
| FD-20 | The header lists every demo; the footer describes the active one. Run on fakes, as are FD-21 to FD-25. | `lists every demo in the header and starts on the first` | Implemented |
| FD-21 | Tab, the arrows and digits switch and wrap; a digit past the last demo goes to the demo. | `switches demos with tab, shift-less arrows and digits, and wraps` | Implemented |
| FD-22 | `q` quits. | `asks the runtime to quit on q` | Implemented |
| FD-23 | The demo fills the screen between the header and footer, and is told that pane. | `draws the demo into the body between the header and the footer, and tells it that pane` | Implemented |
| FD-24 | Moves in the pane become pointer messages; outside, header, footer and the wheel do not. | `turns mouse moves in the body into pointer messages offset by the header, and moves outside into a leave` | Implemented |
| FD-25 | Only the demo that is showing is pulsed, and a demo keeps its state across a switch. | `pulses only the demo that is showing, and keeps each demo state when switching away and back` | Implemented |

## Reach: `examples-fun-reach.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-30 | The tree has the entry, the contract, the shell and three demos. | `has the terminal entry and at least the contract, the shell and three demos` | Implemented |
| FD-31 | No file imports a package internal path. | `imports no package internal path, in any file` | Implemented |
| FD-32 | Only `main.ts` reaches Node, the clock or `Math.random`. | `reaches no Node API outside the terminal entry` | Implemented |

## Browser seam and failure: `web-gpu/gallery-fun.test.ts`, `examples-fun-throw.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-33 | The gallery gives a demo registered in the catalog a card that opens it alone. | `gives a stub entry added to the catalog a card that opens it alone, with no change under examples/web-gpu` | Implemented |
| FD-34 | A demo that throws in `view` is painted as a failure; header, footer and other demos work. | `paints the failure in the pane and keeps the header and footer`, `lets the reader switch to a demo that works` | Implemented |

## Font demos: `examples-fun-fonts.test.ts`, `examples-fun-fonts-edges.test.ts`

Origin: flyingrobots/bijou#891. The frame digests are in `tests/fixtures/examples-fun-font-goldens.ts`: seed 1888,
30 pulses of 1/30 s, `r`, `i` and `Bijou` typed, `escape`, 30 more pulses, with the checked-in Space Mono file.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-40 | The catalog lists the two font demos. | `the catalog lists both font demos` | Implemented |
| FD-41 | Each font demo's frames at 80x24 and 177x53 match the recorded digests. | `<id> paints its recorded frames at 80x24`, `<id> paints its recorded frames at 177x53` | Implemented |
| FD-42 | Each font demo has a readable 80x24 text frame. | `<id> at 80x24 matches tests/fixtures/examples-fun/frames/<id>-80x24.txt` | Implemented |
| FD-43 | The same seed and messages give the same frame. | `<id> repeats itself: the same seed and messages give the same frame` | Implemented |
| FD-44 | Typing, in the demo's own update, edits the message and the HUD names the mode. | `<id> shows the message typed in its own update and the HUD that says so` | Implemented |
| FD-45 | Backspace deletes, typing stops at 24 characters, an empty message is shown. | `<id> edits the message with backspace and stops at 24 characters` | Implemented |
| FD-50 | A one-cell pane paints without throwing. | `<id> paints a one-cell pane without throwing` | Implemented |
| FD-51 | An empty message, a character the font lacks and a lone surrogate paint without throwing. | `<id> paints an empty message, a missing character and a lone surrogate without throwing` | Implemented |
| FD-52 | A paused session stands still and moves on resume. | `<id> stands still while paused and moves again on resume` | Implemented |
| FD-53 | Space types a space while typing and does not pause. | `<id> types a space while typing instead of pausing` | Implemented |
| FD-54 | Seeded printable messages of up to 200 characters, and a seeded storm of keys, do not throw. | `<id> paints seeded printable messages of up to 200 characters without throwing`, `<id> answers a seeded storm of keys without throwing` | Implemented |
| FD-55 | A port that rejects or throws, bytes that are no font, or no bytes give a message in the pane and never a throw. | `shows a message in the pane for <label>, and never throws` | Implemented |
| FD-56 | The pane says why the font is missing. | `says why in the pane when the port gave a reason` | Implemented |

## Font demos and the shell: `examples-fun-fonts-shell.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-60 | While a demo takes text, `q`, digits, tab, arrows and space reach the demo, and shifted letters arrive as `shift+<letter>`. | `sends q, digits, tab, arrows and space to the demo, and shift letters as shift+letter` | Implemented |
| FD-61 | `ctrl+c` still quits; `escape` gives the shell its keys back. | `still quits on ctrl+c, and takes its own keys back on escape` | Implemented |
| FD-62 | The footer names the demo's keys. | `names the demo keys in the footer` | Implemented |
| FD-63 | With no font the font demos show a message and the other demos run. | `shows the message in the font demos only, and the other demos still run` | Implemented |

## Font and dependency: `examples-fun-fonts-licence.test.ts`, browser suite

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-70 | The font is the unmodified upstream file, with the SIL OFL 1.1 text beside it. | `checks in Space Mono Bold Italic unmodified, with the SIL Open Font License 1.1 beside it` | Implemented |
| FD-71 | `NOTICE` names the font and the library with their licences. | `names the font and the library in a NOTICE file at the root` | Implemented |
| FD-72 | `opentype.js` is an exactly pinned root development dependency and in no published package's manifest. | `is a development dependency of the repository, pinned exactly, and of no published package` | Implemented |
| FD-73 | The font is read by a path from the reading module, never from the working directory, and no demo reads a file. | `reads the font by a path from its own module, never by one relative to the working directory` | Implemented |
| FD-74 | In a real browser each font demo draws text from the fetched font, takes typing and leaves the console clean. | `on <backend> the <id> demo draws its text from the fetched font, takes typing, and the console stays clean` (`examples/web-gpu/e2e/gallery-fun-fonts.e2e.ts`) | Implemented |

## Fluid demos: `examples-fun-fluid.test.ts`, `examples-fun-fluid-edges.test.ts`, `examples-fun-resize.test.ts`

The state hash is sha256 of the particle positions and velocities (the FLIP demo adds its grid velocities) after 300
pulses from seed 1888: 60 pulses with a pour key each, a shake, and 240 more. Origin: flyingrobots/bijou#889.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-80 | Both fluid demos are registered, with their names. | `the registry lists both fluid demos after the first three` | Implemented |
| FD-81 | From a fixed seed and a scripted input the state after 300 steps has the recorded hash, on every run. | `<id> reaches the recorded state hash after 300 steps, and the same one on every run` | Implemented |
| FD-82 | Two instances share no state. | `<id> gives two instances no shared state` | Implemented |
| FD-83 | The step is fixed: the pulse `dt` changes nothing. | `<id> ignores the pulse dt: the step is fixed` | Implemented |
| FD-84 | The seed drives the randomness; the same inputs give the same state. | `<id> reads its randomness from the seed`, `<id> follows a seeded input list to the same state twice` | Implemented |
| FD-85 | `r` returns the fluid to its start. | `<id> resets to its start on r` | Implemented |
| FD-86 | `p` pours from the side `t` picks; `w a s d` move the dam break's obstacle. | `pouring adds fluid, from the side that t picks`, `the dam break pours and moves its obstacle` | Implemented |
| FD-87 | A paused session keeps its fluid and takes keys. | `a session paused by space keeps its fluid and still takes keys` | Implemented |
| FD-90 | Zero particles stay finite and paint. | `the particle fluid starts empty, paints, and steps with nothing to move`, `a dam break with zero particles stays finite and paints` | Implemented |
| FD-91 | A shake on the first pulse is safe. | `shaking an empty tank does nothing`, `shaking the dam break on its first pulse gives finite positions that differ from the unshaken run` | Implemented |
| FD-92 | A pane resized mid-run paints at every size and leaves the fluid as it was. | `<id> paints every size and keeps its fluid as it was` | Implemented |
| FD-93 | A long pour stops at the particle cap. | `stops the particle fluid at its cap`, `stops the dam break at its buffer` | Implemented |
| FD-94 | 5,000 steps of seeded input keep positions finite and the particle count bounded (the dam break in a 24 by 8 tank, to stay quick). | `the particle fluid keeps finite positions and a bounded particle count`, `the dam break keeps finite positions and a bounded particle count` | Implemented |

The recorded frames are made after a `resize` to the frame's size. The fluid demos also fall under FD-02 (digests at 80x24 and 177x53), FD-03, FD-10, FD-11 and FD-14, and their 80x24
text frames are `tests/fixtures/examples-fun/frames/fluid-80x24.txt` and `flip-fluid-80x24.txt`.

## 3D demos: `examples-fun-3d.test.ts`, `examples-fun-raycaster.test.ts`

Origin: flyingrobots/bijou#890. The frame digests of the raymarcher, the raycaster and the raytracer are in the same fixture, and their 80x24 text frames are `tests/fixtures/examples-fun/frames/<id>-80x24.txt` (FD-02 and the frames test cover them).

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-100 | The registry lists the three 3D demos. | `the registry lists the raymarcher, the raycaster and the raytracer` | Implemented |
| FD-101 | A one-row pane paints at several widths. | `<id> paints a one-row pane at several widths` | Implemented |
| FD-102 | A frame is a pure function of the model: painting twice gives the same cells. | `<id> paints the same frame twice from the same state` | Implemented |
| FD-103 | `h` hides the heads-up panel and a second `h` restores it. | `<id> h hides the heads-up panel and a second h brings it back` | Implemented |
| FD-104 | The raymarcher light follows `w`, `s`, `a`, `d` and stops at the edge of the unit square. | `the raymarcher light follows w, s, a and d and stops at the edge of the unit square`, `the raymarcher paints a different frame once the light has moved` | Implemented |
| FD-105 | The raytracer camera distance stops at 1.5 and 10, on keys. | `the raytracer camera distance stops at both limits, on keys` | Implemented |
| FD-106 | The raytracer's dithering depends on the seed and on nothing else. | `the raytracer dithering depends on the seed and on nothing else` | Implemented |
| FD-107 | The raytracer tilts with the pointer and keeps the tilt on leave. | `the raytracer tilts with the pointer and keeps the tilt when the pointer leaves` | Implemented |
| FD-110 | The raycaster starts where the original did. | `starts at 3.5, 3.5 facing a quarter pi with full health` | Implemented |
| FD-111 | A scripted walk ends at a known position. | `a scripted walk ends at a known position: three steps, a turn of two, three more` | Implemented |
| FD-112 | Walking into a wall stops at the wall; walking along one slides. | `walking into a wall stops at the wall and the player never stands inside it`, `walking along a wall slides instead of stopping dead` | Implemented |
| FD-113 | Collision lives in `update`: it holds with no frame painted. | `collision holds with no frame ever painted, and w and s walk the same line` | Implemented |
| FD-114 | A seeded walk of 2,000 steps never enters a wall. | `a seeded walk of 2,000 steps never enters a wall and never leaves the map` | Implemented |
| FD-115 | A shot in the firing cone kills a monster in two hits; a shot at nothing hurts nobody; `r` restarts. | `shoots a monster in the firing cone dead in two shots and scores 150`, `a shot at nothing hurts nobody, and r restarts the level` | Implemented |
| FD-116 | Treasure scores 250; a touching monster bites. | `collects treasure for 250 points and takes damage from a monster that touches the player` | Implemented |

## Catalog: `examples-fun-catalog.test.ts`

Origin: flyingrobots/bijou#902.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-120 | Every catalog entry has an id that is its own and reads in an address, a name and a one-line description. No test holds the number, the list or the order of the real demos. | `gives every demo an id that is its own and reads in an address, a name and a one-line description` | Implemented |
| FD-121 | A catalog entry's id, name and description equal the loaded demo's. | `says of each demo what the loaded demo says of itself` | Implemented |
| FD-122 | The catalog imports no demo module statically, and each entry imports a module of its own. | `imports no demo module statically, so each loads only when its entry is asked for` | Implemented |
| FD-123 | `loadDemos` loads the entries it is given in order, a new entry included. | `loads the entries it is given, in their order, a new one included` | Implemented |
| FD-124 | `loadDemos` asks the host for the font once. | `asks the host for the font once, however many demos draw it` | Implemented |
| FD-125 | `loadDemos` rejects when a module fails to load. | `rejects when a demo module fails to load` | Implemented |
| FD-126 | With a font port that rejects, every demo still loads and the font demos show a message. | `shows the message in the font demos only, and the other demos still run` (`examples-fun-fonts-shell.test.ts`) | Implemented |

## The browser entry: `examples-fun-browser.test.ts`

Origin: flyingrobots/bijou#920. Run on a fixture catalog of fakes (`tests/helpers/fun-fixture.ts`) that record their load, their host and their seed.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-127 | `loadSolo` loads the entry it is given and no other. | `loads the entry it is given, and no other` | Implemented |
| FD-128 | The demo is mounted with the seed the page chose. | `mounts the demo with the seed the page chose` | Implemented |
| FD-129 | The demo is handed the font port `loadSolo` was given. | `hands the demo the font port it was given` | Implemented |
| FD-140 | `loadSolo` rejects when the demo module fails to load. | `rejects when the demo module fails to load` | Implemented |

## One demo alone: `examples-fun-solo.test.ts`

Origin: flyingrobots/bijou#902.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| FD-130 | The demo's pane is every row but the last, which names the demo and its keys. | `gives the demo every row but the last, and names the demo and its keys there` | Implemented |
| FD-131 | Nothing lists other demos or names a key that switches or quits. | `shows no list of demos and no key that switches or quits` | Implemented |
| FD-132 | `tab`, the arrows, the digits and `q` reach the demo, and no command is given. | `sends tab, the arrows, the digits and q to the demo, and asks the runtime for nothing` | Implemented |
| FD-133 | `ctrl+c` does nothing. | `does nothing on ctrl+c: the page is how a person leaves` | Implemented |
| FD-134 | The pointer reaches the demo in its own cells from row 0, and leaves on the last row or outside. | `gives the pointer to the demo in its own cells, from the first row, and lets go on the footer row` | Implemented |
| FD-135 | A resize tells the demo its new pane, down to one row. | `tells the demo its pane again when the screen changes` | Implemented |
| FD-136 | Pulses advance the demo; `space` pauses and the last row says so. | `advances on pulses, and space pauses and says so` | Implemented |
| FD-137 | A demo taking text gets every key, shifted letters with their shift. | `sends a demo that is taking text every key, a shifted letter with its shift and space as a key` | Implemented |
| FD-138 | A demo that throws in `view` is painted as a failure, and the last row stays. | `paints a demo that throws in view as a failure in the pane, and keeps the footer` | Implemented |
| FD-139 | Each demo that needs no font paints alone what its session paints in the pane. | `<id> alone paints what its session paints in a pane one row shorter than the screen` | Implemented |
