# BEARING

Current direction and active tensions. Historical ship data is in `CHANGELOG.md`.

## Active Gravity

### 1. Product Surface Depth
- Formalization of the layout and viewport engine.
- Deepening DOGFOOD story quality and variant polish.
- Built-in `i18n` catalog loader for the localization runtime.

### 2. Machine-Readable Interactivity
- Interactive component documentation for the MCP rendering server.
- Refinement of the AI tool boundary for Bijou-authored apps.

### 3. Data Visualization Maturity
- Expansion of the sparkline/brailleChart/stats toolkit.
- Implementation of deeper, interactive chart types.

## Tensions

- **Notification Hit-Testing**: Toast hit-testing remains outside the retained layout system, creating a mismatch between global overlays and local pane viewports.
- **i18n Orchestration**: The localization runtime currently requires manual orchestration of the load-parse-register pipeline.
- **Ambiguous Graphemes**: RE-016 (ambiguous-width emoji icons) lacks a universal fix; width remains dependent on the terminal's rendering context.
- **Frame Timing**: Integration of high-fidelity frame timing with the performance overlay for fine-grained bottleneck detection.

## Next Target

The immediate focus is the **layout and viewport formalization** to ensure split panes and scroll regions share a unified interaction model.
