# BEARING

Current direction and active tensions. Historical ship data is in `CHANGELOG.md`.

## Recent Ships

- `4.4.1` — framed-shell polish and background-fill recovery after `4.4.0`.
- `4.2.0` — [RE-007](./design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md)
  lands the framed shell on the runtime-engine seams and ships
  `@flyingrobots/bijou-mcp`.
- `4.1.0` — DOGFOOD matures through
  [DF-022](./design/DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md),
  [DF-023](./design/DF-023-publish-repo-package-and-release-guides-in-dogfood.md),
  [DF-024](./design/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md),
  and [WF-003](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md).

## Active Gravity

### 1. Product Surface Depth
- Formalization of the layout and viewport engine.
- Deepening DOGFOOD story quality and variant polish.

### 2. Machine-Readable Interactivity
- Interactive component documentation for the MCP rendering server.
- Refinement of the AI tool boundary for Bijou-authored apps.

### 3. Data Visualization Maturity
- Expansion of the sparkline/brailleChart/stats toolkit.
- Implementation of deeper, interactive chart types.

## Tensions

- **Notification Hit-Testing**: Toast hit-testing remains outside the retained layout system, creating a mismatch between global overlays and local pane viewports.
- **Ambiguous Graphemes**: RE-016 (ambiguous-width emoji icons) lacks a universal fix; width remains dependent on the terminal's rendering context.
- **Frame Timing**: Integration of high-fidelity frame timing with the performance overlay for fine-grained bottleneck detection.

## Next Target

The immediate focus is the **layout and viewport formalization** to ensure split panes and scroll regions share a unified interaction model.
