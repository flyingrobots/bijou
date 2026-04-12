# AUDIT: DOCUMENTATION QUALITY (2026-04-11)

## 1. ACCURACY & EFFECTIVENESS ASSESSMENT

- **1.1. Core Mismatch:**
    - **Answer:** The root `README.md` previously referred to "Substrate Properties" which was a tired and imprecise noun. This has been corrected to "System Properties" and "Core Properties." Currently, the most significant mismatch is in the `App` interface example in `packages/bijou-tui/README.md`, which shows `any` types for the model, masking the actual TEA safety guarantees.

- **1.2. Audience & Goal Alignment:**
    - **Answer:**
        - **Target Audience:** Terminal software architects and CLI developers.
        - **Top 3 Questions addressed?**
            1. **"How do I start?"**: Yes (Quick Start in README).
            2. **"How do I scale?"**: Yes (Sub-Apps and App Frame docs).
            3. **"How is it different?"**: Yes ("Why Bijou?" section).

- **1.3. Time-to-Value (TTV) Barrier:**
    - **Answer:** The dependency between `@flyingrobots/bijou` and `@flyingrobots/bijou-node` is implied but not always explicitly required for core components. A developer might try to use `initDefaultContext()` from the core package and fail.

## 2. REQUIRED UPDATES & COMPLETENESS CHECK

- **2.1. README.md Priority Fixes:**
    1. **App Interface Typing**: Update examples to use explicit model types instead of `any`.
    2. **Peer Dependency Clarity**: Explicitly state that `bijou-node` is the official host adapter for Node.js environments.
    3. **Visual Proofs**: Ensure the GIF demo in the README is updated to show the latest high-fidelity motion and transition shaders.

- **2.2. Missing Standard Documentation:**
    1. **`CONTRIBUTING.md`**: Exists, but needs to be aligned with the new `docs/METHOD.md` work doctrine.
    2. **`SECURITY.md`**: Exists, but is generic. Should include terminal-specific security concerns (e.g., escape sequence sanitization).

- **2.3. Supplementary Documentation (Docs):**
    - **Answer:** **Layout Engine internals**. The recursion logic in `layout-node-surface.ts` is complex and critical for performance but lacks a dedicated strategy doc explaining the "localization" vs. "painting" phases.

## 3. FINAL ACTION PLAN

- **3.1. Recommendation Type:** **A. Incremental updates to the existing README and documentation.** (The core has been overhauled; now it needs polish).

- **3.2. Deliverable (Prompt Generation):** `Refine the App interface examples in all READMEs to use strictly typed models. Align CONTRIBUTING.md with the METHOD.md cycle loop. Create 'docs/strategy/layout-engine.md' to explain the geometry localization pipeline.`

- **3.3. Mitigation Prompt:** `Update 'packages/bijou-tui/README.md' and 'GUIDE.md' to replace 'App<any, any>' with a concrete 'App<Model, Msg>' example. Update 'CONTRIBUTING.md' to link directly to 'docs/METHOD.md' for the cycle loop definition. Create a new doc 'docs/strategy/layout-engine.md' detailing the spatial localization and recursion strategies used in the Layout stage.`
