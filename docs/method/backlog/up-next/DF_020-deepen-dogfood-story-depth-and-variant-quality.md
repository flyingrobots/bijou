# DF-020 — Deepen DOGFOOD Story Depth and Variant Quality

Legend: [DF — DOGFOOD Field Guide](../../legends/DF-dogfood-field-guide.md)

## Idea

DOGFOOD now covers every current component family in the canonical reference.

The next stage is no longer breadth. It is depth:

- sharper variants for the families that currently have only one narrow teaching path
- stronger source examples for shell-heavy and authoring-heavy stories
- richer comparison between closely related families

## Why

The coverage ratchet is complete at the family level.

The remaining DOGFOOD work should improve:

- story richness
- source-example quality
- guidance clarity
- variant completeness

## Examples blocked on DOGFOOD coverage

These examples still exist because DOGFOOD does not yet cover their
teaching surface. Once DOGFOOD covers the concept, the example can
be retired:

- `app-frame` — compact framed-app reference (imported by DL-007 test)
- `notifications` — notification stack/routing/history (imported by notifications-demo test)
- `release-workbench` — canonical multi-view shell (imported by canonical-app)
- `showcase` — standalone component explorer
- `v3-demo`, `v3-css`, `v3-motion`, `v3-subapp`, `v3-worker`, `v3-pipeline` — runtime seam references
- `counter`, `spinner`, `progress-download`, `progress-static` — basic TUI starters
- `chat`, `command-palette`, `composable`, `drawer`, `flex-layout`, `focus-area`, `form-group`, `fullscreen`, `grid-layout`, `mouse`, `note`, `package-manager`, `pager`, `paginator`, `perf-gradient`, `pipe`, `print-key`, `select`, `filter`, `split-editors`, `spring`, `status-bar`, `stopwatch`, `textarea`, `theme`, `timeline-anim`, `tooltip`, `transitions`, `logo`, `splash`, `dag`, `dag-fragment`, `dag-pane`, `dag-stats`, `background-panels`, `enumerated-list`

In v4.4.0, 31 examples were retired because DOGFOOD now covers their
component families directly.

## Status

Backlog spawned by the retrospective for DF-019.
