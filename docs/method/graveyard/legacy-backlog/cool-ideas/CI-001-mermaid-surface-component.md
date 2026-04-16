# CI-001 — `mermaidSurface()` Component

Legend: [DF — DOGFOOD Field Guide](../../legends/DF-dogfood-field-guide.md)

## Idea

Since Bijou uses Mermaid for its documentation, wouldn't it be cool to render Mermaid diagrams directly in the TUI? This component would parse a (limited) subset of Mermaid (flowcharts and state diagrams) and render them to a `Surface` using Bijou's box-drawing and graph primitives.

## Why

1. **Self-Documentation**: A TUI app can render its own architecture or cycle state without external tools.
2. **Data-Viz Maturity**: It pushes the "geometric lawfulness" of the terminal by showing that complex, logic-heavy graphs are native to the medium.
3. **Docs Synergy**: If DOGFOOD could render diagrams locally, it would complete the "docs are the demo" story.

## Effort

Large — requires a simplified Mermaid parser and a spatial-layout engine to map diagrams to terminal cells.
