# Components (Zen)

```sh
npm run components
```

Zen opens on a "Components Library" title screen, set in DM Sans; press Enter. After that it shows one Bijou component in the centre of the screen, taken from the same 42-story catalog that DOGFOOD and Block Lab use. It runs inside Bijou's standard app frame, so search, settings and quit behave as in DOGFOOD.

| Key | Action |
| --- | --- |
| `h` `l`, left and right arrows | Previous or next component |
| `Tab`, `Shift-Tab` | Slide the carousel to the next or previous variant |
| `j` `k`, up and down arrows | Scroll when the content is taller than the screen |
| `1` `2` `3` `4` | Output mode: interactive, static, pipe, accessible |
| `i` | Info on or off: the summary, a tip for this variant, when to use the component and when not to, and the variant's example code |
| `r` | Right-to-left layout on or off |
| `/` | Search component names; Enter shows the match, Esc closes |
| `F2` | Settings, including the shell theme |
| `q`, `Esc` | Quit, after a confirmation |

The component's name and current variant sit above it, and dots below it show where you are in the variants. The bottom row shows the active lowering, whether docs are on, and scroll hints; the frame's footer below it shows the key legend.

Crossing into a new component family plays that family's intro slide, which lists the family's functions one per line, grouped as **Components**, **Surface renderers**, and **Setup and state**. The slide enters and leaves through two of Bijou's transition shaders; each family gets its own pair. Slides never advance on their own: Enter, Space, `l`, the right arrow or Tab continues into the family's first component, and `h` or the left arrow goes back. Components that animate open on their animated variant: TUI mode plays it, and static mode shows a single frozen frame.

The example code under `i` is the variant's own `render()` call, read from its story file in `examples/docs/`. Some stories call a shared preview helper, so their example shows that helper rather than a bare component call.

## Right-to-left layout

`r` switches the reading direction. Zen passes it to the app frame through an i18n runtime and mirrors its own body: the breadcrumb flow, the mode row, the variant dots, the carousel's slide direction, and the alignment of prose and slides. In right-to-left layout, `h` and the left arrow move toward the end of the component list. Code, component names, and the components themselves are not mirrored.

The app frame mirrors only what it supports today: the settings drawer and notifications open from the other side. The header, footer, and pane chrome do not mirror yet; issues #571 to #575 track the remaining right-to-left work.
