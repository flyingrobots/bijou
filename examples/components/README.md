# Components Library

```sh
npm run components
```

The Components Library shows one Bijou component at a time in the centre of the screen, with nothing else competing for attention. It uses the same 42-story catalog as DOGFOOD and Block Lab, and runs inside Bijou's standard app frame, so search, settings, and quit behave as they do in DOGFOOD.

The library opens on a "Components Library" title screen, set in DM Sans. Press Enter to start.

| Key | Action |
| --- | --- |
| `h` `l`, left and right arrows | Previous or next component |
| `[` `]` | Previous or next family; plays that family's intro slide |
| `Tab`, `Shift-Tab` | Slide the carousel to the next or previous variant |
| `j` `k`, up and down arrows | Scroll when the content is taller than the screen |
| `1` `2` `3` `4` | Output mode: interactive, static, pipe, accessible |
| `i` | Info on or off: the component's design-system family entry and the on-screen variant's example (see below) |
| `r` | Right-to-left layout on or off |
| `/` | Search component names; Enter shows the match, Esc closes |
| `F2` | Settings, including the shell theme |
| `?` | Every key binding |
| `q`, `Esc` | Quit, after a confirmation |

A breadcrumb above the component names its family, the component, and the variant on screen; dots below it show your position among the variants. The bottom row shows the active output mode and whether info and right-to-left layout are on, as keys you can press. The frame's footer shows the navigation keys.

## Family slides

Entering a new family, with `h`, `l`, `[`, `]`, or search, shows that family's intro slide. It lists the family's functions one per line, grouped under their design-system family names, for example **Transient app notifications** or **Activity stream**. Each family's slide enters and leaves through its own pair of Bijou transition shaders.

Slides never advance on their own. Press Enter, Space, `l`, the right arrow, or Tab to continue into the family's first component, `h` or the left arrow to go back, or `[` and `]` to move between families.

## Info and examples

`i` shows the component's entry in the vocabulary of the design system's Component Families reference (book record R52). It opens with the family name and a summary, then a box titled **Variant: <name>** with the tip for the variant on screen. Below that come **Use when**, **Avoid when**, **Content guidance**, **Ownership**, **Graceful lowering**, and **Related families**, then an **Example**. The component's own story supplies a field where it has one; its family entry in `docs/design-system/component-families.md` supplies **Content guidance** and **Ownership**, and fills any field the story lacks. `guidedFlow()` has no family entry yet, so its panel shows only the story's fields.

The example is the variant's own `render()` call, read from its story file in `examples/docs/`. Long examples are abridged and labelled as such. Some stories call a shared preview helper, so their example shows that helper rather than a bare component call.

Components that animate open on their animated variant. Interactive mode plays it; static mode shows one frozen frame.

## Right-to-left layout

`r` switches the reading direction. The library passes it to the app frame through an i18n runtime and mirrors its own body: the breadcrumb flow, the mode row, the variant dots, the carousel's slide direction, and the alignment of prose and slides. In right-to-left layout, `h`, `[`, and the left arrow move toward the end of the list. Code, function names, and the components themselves are not mirrored.

The app frame mirrors only what it supports today: the settings drawer and notifications open from the other side. The header, footer, and pane chrome do not mirror yet; issues #571 to #575 track the remaining right-to-left work.
