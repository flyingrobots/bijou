# Components Library

```sh
npm run components
```

The Components Library is a deck of 58 slides: a title, a slide for each of 14 sections followed by its components, and an end slide. A section groups related component families for browsing; the 42 components cover 35 of the 36 families in `docs/design-system/component-families.md`. It shows one Bijou component at a time in the centre of the screen, with nothing else competing for attention. It uses the same 42-story catalog as DOGFOOD and Block Lab, and runs inside Bijou's standard app frame, so search, settings, and quit behave as they do in DOGFOOD.

The library opens on a "Components Library" title screen, set in DM Sans. Press Enter to start.

| Key | Action |
| --- | --- |
| `h` `l`, left and right arrows | Previous or next slide, one at a time; stops at the first and last slide |
| `PgUp` `PgDn` (or `[` `]`) | Previous or next section slide; stops at the title and the end slide |
| `Tab`, `Shift-Tab` | Slide the carousel to the next or previous variant |
| `j` `k`, up and down arrows | Scroll when the content is taller than the screen |
| `1` `2` `3` `4` | Output mode: interactive, static, pipe, accessible |
| `i` | Info on or off: the component's design-system family entry and the on-screen variant's example (see below) |
| `r` | Right-to-left layout on or off |
| `/` | Search component names; Enter shows the match, Esc closes |
| `F2` | Settings, including the shell theme |
| `?` | Every key binding |
| `q`, `Esc` | Quit, after a confirmation |

A bar across the top row, in place of the frame header, shows how far you are through the whole deck, ending in a label such as "3 of 58". The Library draws this bar itself: it shows a place in a sequence, not a task's progress, so it does not use `progressBar()`. A breadcrumb above the component names its section and the component. Bijou's `tabs()` below the component list its variants, falling back to `paginator()` dots when the tabs are wider than the screen. The bottom row shows the output modes as tabs, then the info and right-to-left switches with their state (`i info off · r RTL off`). The frame's footer shows the navigation keys.

## Opening on a specific screen

Pass options after `--` to open the library on a particular slide, output mode, and theme:

```sh
npm run components -- --component alert --variant warning --mode pipe --info
npm run components -- --component table --theme book --scheme light --rtl
npm run components -- --component toast --slide family
```

| Option | Values |
| --- | --- |
| `--component` | A story id or function name, such as `alert` or `table` |
| `--variant` | A variant id or label, such as `warning` |
| `--mode` | `interactive`, `static`, `pipe`, or `accessible` |
| `--info` | Open with info shown |
| `--rtl` | Open in right-to-left layout |
| `--slide` | `title`, `family` (the section slide), `component`, or `end` (default: `component` when `--component` is given, otherwise `title`) |
| `--theme` | A shell theme family: `book` or `dogfood` |
| `--scheme` | `dark` or `light` |

Unknown options or values print the problem and the usage, and exit with status 2.

## Section slides

Each section's slide shows the Bijou wordmark, in its own face (Jacquard 12), above the section name. Stepping onto it shows the slide. It lists the section's functions one per line, grouped under their design-system family names, for example **Transient app notifications** or **Activity stream**. Every section slide enters and leaves with the same Bijou transition, a cell dissolve.

slides never advance on their own. Press Enter, Space, `l`, the right arrow, or Tab to continue into the section's first component, or `h` or the left arrow to go back. The title and end slides show the wordmark too.

## Info and examples

`i` shows the component's entry in the vocabulary of the design system's Component Families reference (book record R52). It opens with the family name and a summary, then a box titled **Tip for this variant** with the tip for the variant on screen. Below that, **When to use each variant** lists every variant with its tip; it stays the same as you change variant. Then come **Use when**, **Avoid when**, **Content guidance**, **Ownership**, **Graceful lowering**, and **Related families**, then an **Example**. The component's own story supplies a field where it has one; its family entry in `docs/design-system/component-families.md` supplies **Content guidance** and **Ownership**, and fills any field the story lacks. `guidedFlow()` has no family entry yet, so its panel shows only the story's fields.

The example is the variant's own `render()` call, read from its story file in `examples/docs/`. Long examples are abridged and labelled as such. Some stories call a shared preview helper, so their example shows that helper rather than a bare component call.

Components that animate open on their animated variant. Interactive mode plays it; static mode shows one frozen frame.

## Right-to-left layout

`r` switches the reading direction. The library passes it to the app frame through an i18n runtime and mirrors its own body: the breadcrumb flow, the mode row, the carousel's slide direction, and the alignment of prose and slides. In right-to-left layout, `h`, `[`, and the left arrow move toward the end of the list. Code, function names, and the components themselves are not mirrored.

The app frame mirrors only what it supports today: the settings drawer and notifications open from the other side. The header, footer, and pane chrome do not mirror yet; issues #571 to #575 track the remaining right-to-left work.

## Recording a walkthrough

`npm run record:components` records `components.webp`, a full-colour animated WebP (not committed; needs `img2webp` from `brew install webp`): every slide in deck order, from the title to the end slide, one `l` press at a time on a mock clock. Title, family, and end slides hold longer than component slides. `npm run record:components -- --out=path.webp` writes elsewhere (a `.gif` path writes a GIF), and `-- --stills=1,45` also writes PNG stills at those times in seconds.
