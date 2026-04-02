# DL-009 — Formalize Layout and Viewport Rules

Legend: [DL — Design Language](../legends/DL-design-language.md)

## Idea

Bijou has accumulated strong local layout instincts, but the rules are still implicit and scattered:

- how children fill or center within a parent rect
- when parents vs children own whitespace
- how panes stretch and shrink on terminal resize
- when overflow should wrap, clip, or move into a viewport
- how viewport ownership should align keyboard focus, mouse hit-testing, and scrollbars

This cycle should turn those instincts into one formal layout-language pass instead of leaving them as bug fixes and scattered notes.

## Why

Recent DOGFOOD issues exposed that layout bugs are often really ownership bugs:

- a pane can render as if it has one height while navigation thinks it has another
- a child surface can leave accidental slack because no rule says whether it should fill or be placed
- overflow can look scrollable without actually behaving like a viewport

If Bijou is going to be a serious TUI framework, layout rules need to be a first-class part of the design language.

## Likely scope

- capture canonical resize/stretch/shrink rules
- define parent-owned anchoring and whitespace rules
- define viewport as the canonical overflow ownership seam
- identify which existing components should adopt the formal rules first
