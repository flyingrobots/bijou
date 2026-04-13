---
title: "Upstream edge-overlay scrollbars and BCSS overflow handling"
legend: HT
lane: v5.0.0
---

# Upstream edge-overlay scrollbars and BCSS overflow handling

GitHub Issue #54. Upstream edge-overlay scrollbar and BCSS overflow handling from XYPH into @flyingrobots/bijou-tui. Current viewport/focusArea/pager primitives require apps to hand-roll scrollbar overlay rendering, visibility fade states, and width-safe body composition. Requested: (A) overflow/scroll primitive with overlay vs gutter mode, visibility levels, BCSS-addressable track/thumb/arrows, composable with existing viewport/pager/focusArea; and/or (B) a pane-shell primitive owning header, body, optional right-edge rail, and width-safe chrome that doesn't reflow when the rail hides. Acceptance: edge-overlay scrollbar without dead gutter, ANSI-safe, BCSS-targetable, existing primitives stable unless new mode requested. XYPH has a working local implementation proving the pattern. See https://github.com/flyingrobots/bijou/issues/54 for full details.
