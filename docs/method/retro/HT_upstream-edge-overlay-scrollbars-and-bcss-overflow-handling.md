---
title: "Upstream edge-overlay scrollbars and BCSS overflow handling"
legend: HT
lane: v5.0.0
---

# Upstream edge-overlay scrollbars and BCSS overflow handling

GitHub Issue #54. Upstream edge-overlay scrollbar and BCSS overflow handling from XYPH into @flyingrobots/bijou-tui. Current viewport/focusArea/pager primitives require apps to hand-roll scrollbar overlay rendering, visibility fade states, and width-safe body composition. Requested: (A) overflow/scroll primitive with overlay vs gutter mode, visibility levels, BCSS-addressable track/thumb/arrows, composable with existing viewport/pager/focusArea; and/or (B) a pane-shell primitive owning header, body, optional right-edge rail, and width-safe chrome that doesn't reflow when the rail hides. Acceptance: edge-overlay scrollbar without dead gutter, ANSI-safe, BCSS-targetable, existing primitives stable unless new mode requested. XYPH has a working local implementation proving the pattern. See https://github.com/flyingrobots/bijou/issues/54 for full details.

## Completed (2026-04-14)

The upstreamed solution landed through Option A. `viewport()` and
`viewportSurface()` now support explicit gutter versus overlay scrollbar
ownership, so the rail can paint over the pane edge without reserving a
dead width column. `focusArea()` and `pager()` now thread that mode
through their string and surface paths, preserving previous gutter
behavior by default and only switching when overlay mode is explicitly
requested. `focusArea` also exposes BCSS-targetable thumb and track
identities so shell-owned panes can style overflow chrome without
hand-rolling ANSI-aware replacement logic in app code.
