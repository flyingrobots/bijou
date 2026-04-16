---
title: "DX-027 — Choose-Your-Lane Starter for README and DOGFOOD"
legend: DX
lane: cool-ideas
---

# DX-027 — Choose-Your-Lane Starter for README and DOGFOOD

The 2026-04-14 documentation audit showed that the root front door still makes
it too easy to miss the real package surface and the preferred first-app path.

Cool idea:
- add an interactive "Choose Your Lane" starter in DOGFOOD and mirror it as a
  static summary in `README.md`
- let users pick one of a few intents:
  - build a CLI or prompt flow
  - build a fullscreen TUI
  - scaffold a new framed app
  - render components through MCP
  - work on i18n catalogs/tools
- output the exact install command, first import snippet, and next docs link
  for that lane

Why this feels promising:
- it would turn the README package list from a passive inventory into a
  decision surface
- it would reduce the current split between `README.md`, package READMEs, and
  DOGFOOD for first-time users
- it could be generated from repo-truth metadata instead of hand-maintained
  snippets

This should stay a docs/product idea, not an implicit commitment to redesign
the whole docs system.
