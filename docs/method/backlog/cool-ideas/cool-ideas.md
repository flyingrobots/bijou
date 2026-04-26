# Cool Ideas Backlog

Strategic enhancements and inspirations for the Bijou ecosystem.

## 2026-04-26

### BigBro Audit Tool
- **Idea:** Create a static analysis tool (`bijou-audit`) that scans Bijou integrations for violations of the Core Invariants.
- **Impact:** Automated enforcement of "Geometric Lawfulness" and "Hexagonal Integrity."
- **Features:** Detect hardcoded hex strings, check for missing `ctx` propagation, and identify potential side-effects in `update` functions.

### Terminal Shader Extensions
- **Idea:** Expand the `transition-shaders.ts` library to include aesthetic post-processing effects.
- **Impact:** Enhanced visual fidelity for "Standalone" (Tier 3) applications.
- **Examples:** CRT scanline overlays, terminal bloom/glow effects, and interactive "distortion" during state transitions.

### MCP-Driven UI Generation
- **Idea:** Integrate `bijou-mcp` with LLM tool-calling to allow models to "paint" their own TUI surfaces.
- **Impact:** Dynamic, high-fidelity AI-human interfaces in the terminal.
- **Pattern:** The LLM returns a `LayoutNode` or `Surface` definition that the Bijou runtime then renders natively.

### `bijou-fix-rhythm` CLI
- **Idea:** An automated refactor tool (using jscodeshift or similar) that scans for manual string padding (`'  '`) and `.join('\n')` in Bijou apps and proposes replacements with `box()`, `stack()`, or `spacer()` primitives.
- **Impact:** Accelerates migration to "Geometric Lawfulness" and reduces visual noise in TUI implementations.

### Semantic List Component
- **Idea:** Promote the internal list-slicing logic from `examples/showcase` into a first-class `list()` component in `bijou-tui`.
- **Impact:** Eliminates repetitive "view-state logic" (sludge) in user applications.
- **Features:** Auto-scrolling, focus tracking, and custom row renderers that handle the `isFocused` state semantically.
