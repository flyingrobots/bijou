# DOGFOOD Home Tab — Sapphire Noir Mockups

These six standalone SVGs explore three conceptual DOGFOOD Home-tab directions
in the two shipped modes of the first-party DOGFOOD theme family. They are
design artifacts, not screenshots or claims that a Home tab currently exists.
Every artifact is a literal `150x44` terminal cell grid: pane edges use
box-drawing glyphs, fills occupy whole cells, copy is fixed-width, and all
actions are expressed as keyboard routes. The SVG format is only the portable
container for that TUI surface.

| Direction | Dark | Light | Character |
| --- | --- | --- | --- |
| Command Deck | [`command-deck-dark.svg`](./command-deck-dark.svg) | [`command-deck-light.svg`](./command-deck-light.svg) | Action-first terminal cockpit; strongest default navigation. |
| Proof Atlas | [`proof-atlas-dark.svg`](./proof-atlas-dark.svg) | [`proof-atlas-light.svg`](./proof-atlas-light.svg) | Architecture-first; makes the source-to-Surface proof chain the hero. |
| Editorial Index | [`editorial-index-dark.svg`](./editorial-index-dark.svg) | [`editorial-index-light.svg`](./editorial-index-light.svg) | Classic navigation tree plus reader pane; quietest information density. |

The files use the exact `BIJOU_DARK` and `BIJOU_LIGHT` Sapphire Noir tokens
carried by `DOGFOOD_DARK_THEME` and `DOGFOOD_LIGHT_THEME`. The existing
`assets/Bijou.svg` is passed through Bijou's own raster-to-glyph renderer and
materialized as `░▒▓█` terminal cells, so every output remains standalone while
preserving the product's real rendering posture. Color is role-driven: neutral
surfaces dominate, sapphire marks focus and navigation, and status hues appear
only where the label carries status.

Regenerate the matrix after changing this design source:

```sh
node --import tsx docs/design/mockups/dl-027-sapphire-noir-home/generate.mjs
```

Verify that committed SVGs match the source:

```sh
node --import tsx docs/design/mockups/dl-027-sapphire-noir-home/generate.mjs --check
```
