# Theme Lab

```bash
npm run theme-lab
```

A framed Bijou app whose only job is to make a theme visible: every token as a
swatch, the same components rendered under whichever preset is active, and the
measured contrast that decides whether the palette is usable.

## Why this exists

Colour work you cannot look at is colour work you cannot judge. A hex value in
a source file tells you nothing about whether `semantic.warning` is still
distinguishable from `semantic.accent` once both are on screen. This app is
the feedback loop for [DL-023](../../docs/design/DL-023-sapphire-theme-system.md).

## Pages

| Page | What it shows |
| --- | --- |
| **Swatches** | Every `surface`, `semantic`, `status`, `border`, and `ui` token as a colour chip with its path and hex. |
| **Components** | Real components under the active theme — badges, alerts, progress bars, stepper, box, separator, kbd, and the brand gradient. |
| **Contrast** | Every semantic and status token measured against `surface.primary`, with an AA verdict, plus a role-collision report. |

## Keys

| Key | Action |
| --- | --- |
| `F2` | Theme picker. Cycles all built-in presets. |
| `[` / `]` | Previous / next page |
| `Tab` | Next pane |
| `j` / `k` | Scroll |
| `?` | Help |
| `q` | Quit |

## Reading the output

Two numbers are worth watching.

The help line reports **distinct colours over total tokens** — `bijou-dark`
opens at `11 colours / 33 tokens`. That gap is aliasing, and it is the shape a
hand-authored palette takes: 16 hex literals fanned out across 33 token slots
by 47 `{ref}` aliases.

The Contrast page reports **role collisions** — token paths that resolve to the
exact same value. Aliasing is legitimate when it is deliberate:
`semantic.success` pointing at `status.success` is the system working. It is a
defect when two roles that must stay tellable apart land on one colour, because
no contrast check will ever catch it. In `bijou-dark`, `semantic.accent` and
`status.warning` are both `#f2c45d`, so every gold border, section header,
logo, and cursor renders in the exact colour a warning does.

## Relationship to the DOGFOOD Theme Lab

DOGFOOD already contains a Theme Lab page built by DL-019 through DL-022. That
one is an **editor**: a draft theme, editable colour slots, and a live token
relationship graph, scoped to the DOGFOOD shell.

This app is a **comparator**: no editing, all built-in presets, and an audit
view. It exists to answer "does this palette hold up" rather than "what happens
if I change this slot." The two are complementary, and if the comparator earns
its keep it belongs folded into the DOGFOOD lab rather than living beside it.

## Implementation notes

Themes are handed to the frame as `shellThemes`, so switching one repaints the
chrome as well as the content. Panes read the context through an accessor at
render time rather than capturing it, which is what lets a theme change repaint
the whole app with no page-level state to keep in sync.
