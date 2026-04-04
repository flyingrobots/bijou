# Topmost Layer Dismisses First

## Protected by legends

- [HT — Humane Terminal](../legends/HT-humane-terminal.md)
- [RE — Runtime Engine](../legends/RE-runtime-engine.md)

When multiple interactive layers are open, dismiss actions should target the topmost dismissible layer before they are interpreted as broader shell actions.

Implications:

- overlays, drawers, palettes, and modals should dismiss in top-down order
- `Esc` should not both dismiss one layer and trigger quit or another action beneath it
- the topmost layer owns the active controls and the visible footer/help hints
- underlying panes and regions remain inert until the covering layer is dismissed
