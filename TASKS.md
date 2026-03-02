# v1.0.0 Implementation Tasks — Phase 4: Large File Decomposition

> **How to use:** Find the first unchecked item (`- [ ]`). Read its description, execute it, then check it off (`- [x]`). Each item is self-contained with enough context to execute without reading prior conversation.

---

## Phase 4: Large File Decomposition (SRP)

### 4A. Split dag.ts (941 lines)

- [ ] **Create `packages/bijou/src/core/components/dag-layout.ts` with layer assignment and positioning logic.**

  Extract the following functions from `packages/bijou/src/core/components/dag.ts`:
  - `assignLayers()` — Sugiyama-Lite layer assignment
  - `minimizeCrossings()` — crossing reduction
  - `assignPositions()` — horizontal positioning within layers
  - `computeGridDimensions()` — grid size calculation

  Export all extracted functions. Add an import in `dag.ts` to pull them back in. Verify: `npx tsc --noEmit -p packages/bijou/tsconfig.json && npm test`

- [ ] **Create `packages/bijou/src/core/components/dag-edges.ts` with edge routing logic.**

  Extract from `dag.ts`:
  - `routeEdges()` — edge path computation
  - `renderEdgeChar()` — per-cell edge character selection
  - Any edge-related type definitions (e.g. `EdgeSegment`, `RoutedEdge`)

  Export all extracted functions. Update imports in `dag.ts`. Verify build and tests.

- [ ] **Create `packages/bijou/src/core/components/dag-render.ts` with string output and ANSI rendering.**

  Extract from `dag.ts`:
  - `renderGrid()` — grid-to-string conversion
  - `renderNodeBox()` — node box rendering with badges
  - `renderRich()` / `renderPipe()` / `renderAccessible()` — mode-specific renderers

  Keep `dag.ts` as the public entry point that composes layout → edges → render. Verify build and tests.

- [ ] **Update `dag.ts` to import from the three new modules and re-export the public API.**

  `dag.ts` should contain only the public `dag()`, `dagSlice()`, and `dagLayout()` entry points plus the public types. All implementation is delegated to `dag-layout.ts`, `dag-edges.ts`, and `dag-render.ts`. Verify build and tests.

### 4B. Split markdown.ts (468 lines)

- [ ] **Create `packages/bijou/src/core/components/markdown-parse.ts` with the two-pass block/inline parser.**

  Extract from `markdown.ts`:
  - `parseBlocks()` — block-level parsing (headings, lists, code blocks, blockquotes, hr, paragraphs)
  - `parseInline()` — inline parsing (bold, italic, code, links, strikethrough)
  - Block/inline AST types

  Export all extracted functions and types. Verify build and tests.

- [ ] **Create `packages/bijou/src/core/components/markdown-render.ts` with mode-specific output.**

  Extract from `markdown.ts`:
  - `renderInteractive()` — styled ANSI output
  - `renderPipe()` — plain text output
  - `renderAccessible()` — accessibility-friendly output
  - Word wrapping logic

  Keep `markdown.ts` as the public entry that calls parse → render. Verify build and tests.

### 4C. Extract textarea editor

- [ ] **Create `packages/bijou/src/core/forms/textarea-editor.ts` with the interactive editor state machine.**

  Extract from `textarea.ts` the ~200 lines of interactive editor logic:
  - Editor state type (cursor position, buffer, scroll)
  - Key handling (arrow keys, Home/End, Ctrl+A, Ctrl+E, backspace, delete, Enter)
  - Render function for the interactive editor view

  Keep `textarea.ts` as the entry point with validation and mode dispatch. Verify build and tests.

### 4D. Extract filter interactive UI

- [ ] **Create `packages/bijou/src/core/forms/filter-interactive.ts` with the interactive terminal UI.**

  Extract from `filter.ts` the ~150 lines of interactive UI:
  - Filter state type (query, filtered results, cursor)
  - Key handling (typing, arrow keys, Enter, Escape)
  - Render function for the interactive filter view

  Keep `filter.ts` as the entry point with validation and fallback. Verify build and tests.

### 4E. Verify full build and test suite

- [ ] **Run all type checks and tests.**

  ```
  npx tsc --noEmit -p packages/bijou/tsconfig.json
  npx tsc --noEmit -p packages/bijou-node/tsconfig.json
  npx tsc --noEmit -p packages/bijou-tui/tsconfig.json
  npm test
  ```

  All must pass with zero errors. No test should need modification — the refactors are purely structural (moving code between files).

### 4F. Update roadmap and commit

- [ ] **Update `docs/ROADMAP.md` Phase 4 section — strike through completed tasks. Update `docs/CHANGELOG.md` unreleased section. Commit.**
