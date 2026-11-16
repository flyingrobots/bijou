# Themes, tokens, BCSS, and contrast

Sources: `packages/bijou/src/core/theme/` (tokens, presets, builder, doctor), `packages/bijou/src/context-theme.ts`,
`packages/bijou-tui/src/css/`, `packages/bijou-node/src/node-context*.ts`. Example: `examples/docs/dogfood-shell-themes.ts`.

## The theme model

A `Theme` holds token groups; each token is a `TokenValue { hex, bg?, modifiers? }`:

| Group | Keys | Read with |
| --- | --- | --- |
| `semantic` | `primary`, `accent`, `muted`, `success`, `warning`, `error`, `info` | `ctx.semantic('accent')` |
| `surface` | `primary`, `secondary`, `elevated`, `overlay`, `muted` (`hex` is text, `bg` the fill) | `ctx.surface('elevated')` |
| `border` | `primary`, `secondary`, `success`, `warning`, `error`, `muted` | `ctx.border('muted')` |
| `status` | `success`, `error`, `warning`, `info`, `pending`, `active`, `muted` | `ctx.status('pending')` |
| `ui` | `cursor`, `focusGutter`, `scrollThumb`, `scrollTrack`, `sectionHeader`, `logo`, `tableHeader`, `trackEmpty` | `ctx.ui('focusGutter')` |
| `gradient` | `brand`, `progress` (stops `{ pos, color: RGB }`) | `ctx.gradient('brand')` |

Modifiers: `bold`, `dim`, `inverse`, `underline` (plus curly, dotted, dashed), `strikethrough`. Components pass a
token to `ctx.style.styled(token, text)`; on Surfaces, put the token's `hex` and `bg` into the cell.

**Rules:** components and apps read tokens, never hard-coded hex. Text on a surface uses that surface's `hex` on its
`bg`. Meaning survives without colour (NO_COLOR, pipe, accessible): pair colour with a word, glyph, or position.
Muted text must stay readable, not merely dim: dim text is drawn halfway to the background.

## Creating and switching themes

- Presets: `PRESETS` (`bijou-dark`, `bijou-light`, `cyan-magenta` (the fallback), `teal-orange-pink`, `nord`,
  `catppuccin`), plus `BIJOU_DARK`, `BIJOU_LIGHT`.
- Small change: `extendTheme(base, { semantic: { accent: tv('#f2a65a') } })` with `tv(hex, modifiers?)`.
- Mode-keyed token themes: `defineTheme().id('x').mode('dark', m => ...).mode('light', m => ...).build()`
  (a `TokenTheme`, read back with `resolveThemeColorRef`). DTCG import and export: `fromDTCG` / `toDTCG`.
- Keep provenance when copying a rule-authored theme: `renameRuleAuthoredTheme(theme, name)`.
- Swap a context's theme: `cloneContextWithTheme(ctx, theme)` (keeps NO_COLOR and colour scheme).
- Node selection: `startApp(app, { theme, themes, themeMode: 'auto'|'light'|'dark', themeOverride })`;
  the `BIJOU_THEME` env var picks a preset name or a DTCG `.json` path.

## Shell themes (framed apps)

`createFramedApp({ shellThemes, onShellThemeChange })`. A spec is a single theme `{ id, label, theme }` or a paired
family `{ id, label, modes: [{ id: 'dark', label, theme }, { id: 'light', ... }] }`. The settings drawer gains a
"Shell theme" row and `ctrl+t` toggles dark and light within a family. `onShellThemeChange({ ctx, shellThemeId,
modeId })` hands you the re-themed context: re-render anything the app draws from its own context.

## BCSS (Bijou CSS)

Pass a stylesheet to `run(app, { css })` or `startApp(app, { css })`.

```css
FrameHeader#frame-header { color: var(semantic.primary); background: var(surface.elevated); }
FrameHelp { background: var(surface.muted); }
.focused { color: var(ui.focusGutter); font-weight: bold; }
@media (width < 80) { Table { overflow: wrap; } }
```

- Selectors: type, `#id`, `.class`, comma lists, `!important`, `@media (width|height <op> N)`.
- `var(path)` resolves through the active theme's token graph; `background` takes the token's `bg`.
- Properties components read: `color`, `background`, `font-weight`, `font-style`, `text-decoration`, `overflow`,
  `overflow-x`, `text-overflow`, `white-space`.
- Styled identities: `FrameHeader#frame-header`, `FrameHelp#frame-help` (classes `mode-*`, `page-*`), frame panes
  (`#<paneId>`, `.focused` / `.unfocused`), `FocusArea`, `Badge`, `Box`, `Table` (their `id` and `class` options).

## Contrast and accessibility

- Targets: 4.5:1 for text on every surface; 3:1 minimum for non-text chrome. `doctorTheme(theme)` reports
  `low-contrast`, `missing-token`, `invalid-color`, `color-reuse`; `defineThemeSafePairs()` declares the pairs a
  theme guarantees.
- Bijou repo: `npm run audit:components` renders every component variant in every mode and theme, flags contrast
  (error below 3:1, warning below 4.5:1, dim measured as drawn), colours outside the theme, escape codes in pipe or
  accessible output, and decorative glyphs in accessible output. CI fails on errors not in its baseline.
- NO_COLOR removes colour but keeps the interactive mode; `BIJOU_ACCESSIBLE=1` selects the accessible mode.
