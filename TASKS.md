# Architecture Audit — Phase 4: Large File Decomposition

> **How to use:** Find the first unchecked item (`- [ ]`). Read its description, execute it, then check it off (`- [x]`). Each item is self-contained with enough context to execute without reading prior conversation.

---

## Phase 4: Large File Decomposition (SRP)

### 4A. Split dag.ts (941 lines)

- [x] **Create `packages/bijou/src/core/components/dag-edges.ts` with edge routing logic.**

- [x] **Create `packages/bijou/src/core/components/dag-layout.ts` with layer assignment and column ordering.**

- [x] **Create `packages/bijou/src/core/components/dag-render.ts` with node box + interactive/pipe/accessible renderers.**

- [x] **Rewrite `dag.ts` as facade importing from the three new modules.**

### 4B. Split markdown.ts (468 lines)

- [x] **Create `packages/bijou/src/core/components/markdown-parse.ts` with the two-pass block/inline parser and word wrapping.**

- [x] **Create `packages/bijou/src/core/components/markdown-render.ts` with mode-specific block rendering.**

- [x] **Rewrite `markdown.ts` as facade importing from the two new modules.**

### 4C. Extract textarea editor

- [x] **Create `packages/bijou/src/core/forms/textarea-editor.ts` with the interactive editor state machine.**

- [x] **Rewrite `textarea.ts` as facade with type re-export.**

### 4D. Extract filter interactive UI

- [x] **Create `packages/bijou/src/core/forms/filter-interactive.ts` with the interactive terminal UI.**

- [x] **Rewrite `filter.ts` as facade with type re-exports.**

### 4E. Verify full build and test suite

- [x] **Run all type checks and tests.**

  ```sh
  npx tsc --noEmit -p packages/bijou/tsconfig.json
  npx tsc --noEmit -p packages/bijou-node/tsconfig.json
  npx tsc --noEmit -p packages/bijou-tui/tsconfig.json
  npm test
  ```

  All 1604 tests pass. Zero test modifications (beyond ANSI lint allowlist). Zero index.ts modifications.

### 4F. Update roadmap and commit

- [x] **Update `docs/ROADMAP.md` Phase 4 section — strike through completed tasks. Update `docs/CHANGELOG.md` unreleased section. Commit.**
