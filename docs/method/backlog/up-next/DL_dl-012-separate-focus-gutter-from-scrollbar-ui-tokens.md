---
title: DL-012 Separate focus gutter chrome from scrollbar UI tokens
legend: DL
lane: up-next
priority: high
keywords:
  - theme
  - focus
  - scrollbar
  - shell
  - dogfood
---

# DL-012 Separate focus gutter chrome from scrollbar UI tokens

DOGFOOD exposed a real vocabulary gap in the built-in theme contract: focused
pane gutters are currently painted with ad hoc theme-derived tokens, while
scrollbars use the built-in `ui.scrollThumb` / `ui.scrollTrack` keys. That
means shell focus chrome and scroll chrome can drift together visually without
any explicit semantic separation.

This should be fixed in the token system, not by one-off per-app palette
tweaks.

Desired outcome:
- add a dedicated built-in `ui` token for focused pane chrome
- stop treating focused gutters as anonymous accent-colored geometry
- keep scrollbars on `ui.scrollThumb` / `ui.scrollTrack`
- document when shell focus chrome should use `ui.*` versus `semantic.accent`

The fix should start with DOGFOOD, but the contract needs to be reusable for
other framed apps too.
