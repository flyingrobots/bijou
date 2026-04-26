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
