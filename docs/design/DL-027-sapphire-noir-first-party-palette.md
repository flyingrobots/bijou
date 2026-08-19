---
title: DL-027 Sapphire Noir First-Party Palette
legend: DL
lane: roadmap
priority: medium
github_issue: 497
status: active
keywords:
  - design-language
  - color
  - oklch
  - sapphire
  - themes
  - accessibility
  - v9.0.0
---

Legend: [DL - Design Language](../legends/DL-design-language.md)

## Linked Work

- Parent campaign: [#501](https://github.com/flyingrobots/bijou/issues/501)
- First-party preset story: [#497](https://github.com/flyingrobots/bijou/issues/497)
- Perceptual colour floor: [#352](https://github.com/flyingrobots/bijou/issues/352)
- Theme-generator horizon: [#318](https://github.com/flyingrobots/bijou/issues/318)
- CVD simulation and checking: [#500](https://github.com/flyingrobots/bijou/issues/500)
- Campaign design: [DL-023](./DL-023-sapphire-theme-system.md), currently
  carried by [PR #516](https://github.com/flyingrobots/bijou/pull/516)

## Sponsors

- **Human:** James Ross — the first-party colours feel bad; make Bijou feel
  sleek and sexy.
- **Agent:** Codex — convert that taste signal into a derived, inspectable,
  accessible palette instead of another hand-picked hex dump.

## Decision Summary

Bijou's first-party dark and light themes become one derived **Sapphire Noir**
system. The dark theme is the hero: cool graphite surfaces, ice-neutral text,
one luminous sapphire accent family, and semantic colours reserved for actual
status. The light counterpart keeps Bijou's warm-cream requirement but tightens
it into warm porcelain with sapphire ink and chrome.

"Sleek and sexy" means premium, restrained, and dark-first here. It does not
mean a cyberpunk rainbow. The distribution follows a 60/30/10 character split:

- roughly 60% quiet surfaces;
- roughly 30% neutral text and structural chrome;
- at most 10% sapphire focus or semantic status colour.

The implementation uses OKLCH because equal numeric changes in HSL do not
produce equal perceived changes. Concrete hex values are generated at runtime
from a small seed model and then enter the existing token graph:

```text
Sapphire seed + mode curves
  -> reference palette
  -> semantic/status/surface/ui definitions
  -> compileRuleAuthoredPreset()
  -> components
```

No component receives a private colour literal.

## Directions Considered

| Direction | Character | Strength | Rejected cost |
| --- | --- | --- | --- |
| **Sapphire Noir** | graphite, ice, electric sapphire, reserved amber | premium restraint; brand continuity; strong hierarchy | selected |
| Neon Afterdark | sapphire-violet-cyan hue cycling | dramatic and kinetic | too noisy in dense TUIs; weaker ANSI-16 separation |
| Mineral Studio | warm porcelain, ink, muted blue, brass | elegant and editorial | light-first character; less crisp in the hero dark shell |

An extracted-palette approach was also rejected: Bijou has no canonical image
whose accidental colours should become product authority. The existing hue-255
identity is the right anchor; the problem is how roles are mapped onto it.

## Current Truth

The current presets call themselves calm, but two choices undermine that goal.

1. Dark body ink is warm parchment (`#f4e8bf`) while most secondary text is
   lavender. Large areas therefore read as aged paper laid over navy rather
   than a precise modern instrument.
2. Dark `semantic.accent` and `status.warning` both resolve to `#f2c45d`.
   Borders, section headers, the logo, the cursor, focus chrome, and warnings
   all shout in the same gold. Emphasis has no semantic meaning.
3. Light `brand.primary` and `brand.info` both resolve to `#285c9e`, so brand
   and informational status are indistinguishable.
4. The presets are predominantly typed-in hex values. The token graph explains
   references and two decisions, but it cannot explain how the palette itself
   was constructed.

## Hill

A person can open DOGFOOD in dark or light mode and immediately read one calm
visual hierarchy: surface depth first, typography second, sapphire focus third,
and semantic status only when something actually has status. They can inspect
the theme and recover the seed, mode, role mapping, and contrast evidence that
produced every visible token.

## Palette Model

### Shared seeds

- Brand hue: OKLCH `h = 255`.
- Surface hue follows the brand at very low relative chroma in dark mode.
- Light surfaces retain a warm porcelain hue near `h = 85`, satisfying the
  existing warm/cool design requirement without turning text yellow.
- Status hues are deterministic offsets from the brand anchor:
  success `-110`, warning `-175`, error `+130`, and info `+35` degrees.
- Chroma is expressed relative to the sRGB gamut shell at each lightness and
  hue. A requested `relC` therefore means the same design intensity at a dark,
  middle, or pale stop without silently clipping seven stops of a ramp.

### Mode curves

Dark surfaces occupy low lightness with small, increasing chroma from overlay
to elevation. Dark inks occupy high lightness and low chroma. Light mode mirrors
that hierarchy around warm-porcelain surfaces, while its interactive sapphire
uses a darker stop that clears body-text contrast.

Status colours share character rather than raw chroma: comparable perceived
lightness, restrained relative chroma, and enough OKLAB distance to remain
distinct in ordinary vision. Colour is never the only status signal; existing
labels, glyphs, and modifiers remain intact.

## Public And Internal Boundaries

The cycle lands the minimum honest floor required by #497:

- public sRGB, OKLAB, and OKLCH conversion helpers;
- chroma-preserving sRGB gamut mapping that holds lightness and hue while
  reducing chroma;
- OKLAB delta-E and circular hue interpolation;
- a dependency-free gamut-relative OKLCH constructor used by the preset model;
- one shared first-party palette generator consumed by both `BIJOU_DARK` and
  `BIJOU_LIGHT`.

The generator exposes reference colours and semantic mapping separately. Raw
colour values belong only to generated/reference output. Components continue
to consume semantic tokens.

## Scope

1. Add the perceptual conversion and gamut helpers with tests written first.
2. Add the shared Sapphire Noir seed and mode curves.
3. Rebuild both first-party presets through that shared system.
4. Resolve the accent/warning and primary/info collisions.
5. Prove contrast, truecolor role separation, ANSI-256/ANSI-16 degradation,
   and rendered DOGFOOD/Theme Lab output.
6. Update user-facing theme doctrine and changelog truth.

## Non-Goals

- No new runtime dependency.
- No Design Book or RampenSau package in a published package.
- No generic interactive theme generator; #318 remains broader follow-up.
- No CVD simulation claim; #500 remains the authority for that work.
- No gradient interpolation rewrite; #504 remains separate.
- No ANSI quantizer rewrite; #499 remains separate. This cycle checks the
  existing downsample result but does not repair the quantizer.
- No change to `CYAN_MAGENTA`, `TEAL_ORANGE_PINK`, Nord, or Catppuccin.
- No component layout or typography redesign.

## Playback Questions

1. Does the dark shell read as graphite and ice before any accent is noticed?
2. Is sapphire the obvious focus/brand colour without colouring every row?
3. Can a warning be distinguished from ordinary focus at a glance?
4. Does light mode still feel warm without using warm body text?
5. Do status, focus, text, and surface roles retain their hierarchy in
   truecolor, ANSI-256, ANSI-16, and no-colour output?
6. Can Theme Lab explain the palette as generated references and semantic
   decisions rather than a flat list of unrelated literals?

## Accessibility And Assistive Posture

- Every foreground/background pair used by the first-party DOGFOOD safe-pair
  matrix must meet its existing WCAG 2.x threshold in both modes.
- Body text targets at least 4.5:1; non-text chrome targets at least 3:1.
- Status roles must be textually or structurally identified; hue is redundant
  information, not the only information.
- ANSI-256 and ANSI-16 output must keep focus, warning, error, and success from
  collapsing onto one terminal index where the current quantizer permits it.
- Accessible, pipe, and `NO_COLOR` lowerings remain semantically unchanged.
- APCA and CVD simulation are recorded follow-ups, not claims made here.

## Localization And Directionality Posture

The cycle changes colour data, not copy, order, or geometry. Existing localized
labels and bidirectional layout retain authority. Screenshot evidence must use
token roles rather than position or English strings as the colour oracle.

## Agent Inspectability And Explainability Posture

- Export or otherwise expose the shared seed model and generated reference
  palette so an agent can state which input produced a token.
- Preserve `compileRuleAuthoredPreset()` provenance for semantic decisions.
- Tests assert properties such as hue family, contrast, monotonic lightness,
  and role separation instead of snapshotting every generated hex.
- Exact generated hex is still deterministic and may be shown in Theme Lab,
  but it is output evidence rather than authoring authority.

## Linked Invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Implementation Outline

1. Add conversion types and reference-value tests at the public colour facade.
2. Add gamut checks and constant-lightness/hue chroma reduction.
3. Build gamut-relative reference ramps from the shared hue and mode curves.
4. Map references into status, semantic, border, UI, surface, and gradient
   definitions.
5. Compile both presets through the current rule-authored token graph.
6. Render before/after Theme Lab and representative docs frames at fixed
   geometry; inspect the actual colour cells, not only accessibility text.

## Tests To Write First

1. Known sRGB colours convert to the published OKLAB references and round-trip
   within one byte.
2. Gamut mapping leaves in-gamut colours unchanged; an out-of-gamut request
   retains lightness and hue within tolerance and only lowers chroma.
3. Gamut-relative chroma `0` is neutral, `1` reaches the shell without leaving
   sRGB, and intermediate values are monotonic.
4. Both preset modes read their brand family from the same hue seed.
5. Mutating the seed hue moves both brand families while preserving the token
   topology; hard-coded brand literals would fail this calibration.
6. `semantic.accent !== semantic.warning` in both modes, and light
   `brand.primary !== brand.info` in the generated references.
7. All required safe pairs meet their thresholds on all five surfaces.
8. Primary, accent, success, warning, error, and info retain a minimum ordinary
   OKLAB distance; mapping warning back to accent must fail this calibration.
9. Generated reference ramps are monotonic in lightness and every output is in
   sRGB.
10. Representative components paint semantic theme tokens and retain visible
    labels in no-colour output.

## Closeout Notes

Implementation is complete on `cycle/sapphire-noir` for
[PR #517](https://github.com/flyingrobots/bijou/pull/517):

- `BIJOU_DARK` and `BIJOU_LIGHT` now compile through one Sapphire reference
  generator and the existing rule-authored token graph.
- Public OKLAB/OKLCH conversion, gamut-shell, gamut-relative chroma, delta-E,
  and circular hue helpers make the derivation inspectable without adding a
  runtime dependency.
- Public runtime guards reject unsupported palette modes, malformed RGB tuple
  shapes, and invalid Sapphire seed containers with controlled errors.
- Focus and all four status roles are distinct in truecolor, ANSI-256, and
  ANSI-16. The lowest measured semantic/surface pair is `5.03:1` in dark mode
  and `5.86:1` in light mode.
- A deterministic `150x44` `Surface` render was inspected in both modes. The
  repository VHS recorder could not connect to `ttyd`
  (`net::ERR_CONNECTION_REFUSED`), so no tracked recording was regenerated or
  claimed.
- The complete local CI-equivalent gate passed: Code Dojo debt/strict/size,
  build, test typecheck, every workspace lint, ESLint, `934` test files / `4,137`
  tests, scripted interactive examples, and both DOGFOOD smoke scenarios.

The generic theme generator (#318), CVD simulation (#500), gradient
interpolation (#504), and quantizer changes (#499) remain separate work.
This design remains `active` until the pull request lands.

## DOGFOOD Home-Tab Mockup Matrix

The follow-up visual exploration lives in
[`mockups/dl-027-sapphire-noir-home/`](./mockups/dl-027-sapphire-noir-home/README.md).
It renders three conceptual Home-tab directions against both shipped DOGFOOD
theme modes, producing one standalone SVG for every direction/mode pair:

- **Command Deck** — an action-first terminal cockpit;
- **Proof Atlas** — an architecture-first rendering of the source-to-Surface
  proof chain;
- **Editorial Index** — a classic navigation-tree and reader-pane entrance.

The six artifacts use the live `BIJOU_DARK` and `BIJOU_LIGHT` token values and
materialize a literal `150x44` cell grid. The existing `assets/Bijou.svg` is
lowered through Bijou's raster-to-glyph renderer rather than presented as a web
logo. They are design mockups, not screenshots or claims that a Home tab has
been implemented. The matrix is generated deterministically and visually
inspected at `1500x880` in both modes.
