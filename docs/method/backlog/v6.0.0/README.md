# v6.0.0 - Layout Truth And Standard Blocks

Next major-version shaping lane.

This release turns the layout and blocks doctrine into shipped runtime and
developer experience work. The target is not "more widgets." The target is
for Bijou to make geometry, block composition, and mode lowering explicit
enough that first-party apps, docs, MCP payloads, and future tooling can all
consume the same truth.

## Release Thesis

Frame owns geometry. Blocks prove it.

Bijou layout should be a retained, semantic, cell-native constraint
negotiation system:

- constraints flow down
- preferences flow up
- assigned integer rectangles flow down
- renderers paint only after layout resolution
- semantic truth lowers outward into interactive, static, pipe, and
  accessible modes

The boundary remains:

- layout lays out
- workspace organizes
- interaction commands
- renderer paints
- modes lower
- inspector explains

## Active Design Anchors

- [**RE-035**](../../../design/RE-035-mandatory-layout-envelope-and-constraint-negotiation.md) -
  mandatory layout envelope and constraint negotiation
- [**DX-031**](../../../design/DX-031-standard-bijou-blocks.md) -
  standard Bijou blocks

## Core Runtime Scope

- [**DF-065**](../../../design/DF-065-audit-workspace-layout-family-across-real-surfaces.md) -
  audit workspace layout family across real surfaces
- [**DF-060**](../../../design/DF-060-audit-viewport-masking-and-scrollable-inspection-panes-family-across-real-surfaces.md) -
  audit viewport masking and scrollable inspection panes
- [**DL-012**](../../../design/DL-012-separate-focus-gutter-from-scrollbar-ui-tokens.md) -
  separate focus gutter chrome from scrollbar UI tokens
- [**DX-030**](./DX-030-add-boundary-aware-pointer-selection-and-copy.md) -
  add boundary-aware pointer selection and copy

## First Blocks And Shell Proof

- [**DF-063**](../../../design/DF-063-audit-app-shell-family-across-real-surfaces.md) -
  audit app shell family across real surfaces
- [**DX-032**](../../../design/DX-032-create-tui-app-skeleton-renders-consumer-pages.md) -
  make `createTuiAppSkeleton` render consumer pages
- [**DF-064**](../../../design/DF-064-audit-keybinding-help-and-shell-hints-family-across-real-surfaces.md) -
  audit keybinding help and shell hints
- [**DF-061**](./DF-061-audit-overlay-primitives-family-across-real-surfaces.md) -
  audit overlay primitives
- [**DF-062**](./DF-062-audit-notification-system-family-across-real-surfaces.md) -
  audit notification system
- [**DF-036**](../../../design/DF-036-audit-loading-placeholders-family-across-real-surfaces.md) -
  audit loading placeholders
- [**DF-041**](../../../design/DF-041-audit-inspector-panels-family-across-real-surfaces.md) -
  audit inspector panels
- [**DF-049**](../../../design/DF-049-audit-multi-field-and-staged-forms-family-across-real-surfaces.md) -
  audit multi-field and staged forms
- [**DF-066**](../../../design/DF-066-audit-data-visualization-family-across-real-surfaces.md) -
  audit data visualization

## Tooling And Release Hygiene

- [**DF-027**](./DF-027-storybook-style-tool-for-bijou.md) -
  seed a Storybook-style tool for Bijou blocks and component stories
- [**DX-033**](./DX-033-remove-showcase-layout-sludge.md) -
  remove showcase layout sludge and manual scrolling/string assembly
- [**WF-009**](../../../design/WF-009-keep-release-prs-under-automated-review-file-limits.md) -
  keep release PRs under automated review file limits

## Execution Order

1. Ship this release lane prep.
2. Pull one v6 item into a focused cycle.
3. Implement it with tests, docs, and DOGFOOD proof where relevant.
4. Commit, push, open a PR, and merge only after CI/CD is green.
5. Repeat until this lane is empty or intentionally reshaped.

Stop before tagging `v6.0.0`. The tag is a separate release operation after
the lane is complete and release readiness is green.
