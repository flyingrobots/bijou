# AUDIT: CODE QUALITY (2026-04-11)

## 0. 🏆 EXECUTIVE REPORT CARD (Strategic Lead View)

|**Metric**|**Score (1-10)**|**Recommendation**|
|---|---|---|
|**Developer Experience (DX)**|8.5|**Best of:** Seamless "Pure CLI" to "Interactive TUI" scaling.|
|**Internal Quality (IQ)**|9.0|**Watch Out For:** `runtime.ts` complexity sprawl.|
|**Overall Recommendation**|**THUMBS UP**|**Justification:** High-fidelity architectural foundation with strictly enforced hexagonal boundaries.|

---

## 1. DX: ERGONOMICS & INTERFACE CLARITY (Advocate View)

- **1.1. Time-to-Value (TTV) Score (1-10):** 8
    - **Answer:** Fast for simple scripts, but full TUI setup requires multiple package imports and manual context wiring.
    - **Action Prompt (TTV Improvement):** `Refactor @flyingrobots/bijou-node to provide a single 'startApp(app, options)' entry point that handles initDefaultContext(), TEA loop execution, and graceful shutdown in one call.`

- **1.2. Principle of Least Astonishment (POLA):**
    - **Answer:** `view()` returning `Surface | LayoutNode` is powerful but non-obvious to beginners who expect strings.
    - **Action Prompt (Interface Refactoring):** `Update the App interface type definition to include a JSDoc @example showing how to use stringToSurface() for beginners, and consider adding a 'stringView' helper that auto-converts return values.`

- **1.3. Error Usability:**
    - **Answer:** Render errors in `runtime.ts` are caught but the stack trace is written directly to stderr, which can be messy in alt-screen mode.
    - **Action Prompt (Error Handling Fix):** `Implement an 'Error Surface' that renders crash data (stack trace, model snapshot) using Bijou components before exiting the alt-screen, providing a human-readable post-mortem.`

---

## 2. DX: DOCUMENTATION & EXTENDABILITY (Advocate View)

- **2.1. Documentation Gap:**
    - **Answer:** Deeper guidance on custom "Post-Process" middleware and Shader development is missing from the Advanced track.
    - **Action Prompt (Documentation Creation):** `Create 'docs/strategy/pipeline-extensibility.md' detailing the RenderState lifecycle and how to implement custom Post-Process middleware for effects like Grayscale or CRT flicker.`

- **2.2. Customization Score (1-10):** 9
    - **Answer:** The programmable pipeline is a world-class extension point. The weakest point is theme-token reactivity outside of core components.
    - **Action Prompt (Extension Improvement):** `Expose 'tokenGraph.subscribe()' in the BijouContext to allow third-party components to react to theme changes without manual context cloning.`

---

## 3. INTERNAL QUALITY: ARCHITECTURE & MAINTAINABILITY (Architect View)

- **3.1. Technical Debt Hotspot:**
    - **Answer:** `packages/bijou-tui/src/runtime.ts`. It manages TEA lifecycle, double-buffering, pipeline orchestration, and raw terminal escapes.
    - **Action Prompt (Debt Reduction):** `Decompose 'runtime.ts' by extracting the double-buffering and framebuffer management into a 'FrameManager' class, and move terminal escape sequences to a dedicated 'TerminalIO' adapter.`

- **3.2. Abstraction Violation:**
    - **Answer:** Layout calculation logic is split between core (`splitPane`) and TUI (`splitPaneSurface`).
    - **Action Prompt (SoC Refactoring):** `Extract all 'pure geometry' logic (ratios, constraints, area calculation) from TUI layout helpers into a shared 'LayoutEngine' in @flyingrobots/bijou.`

- **3.3. Testability Barrier:**
    - **Answer:** Testing async commands (`Cmd`) still requires some knowledge of the internal `EventBus` implementation.
    - **Action Prompt (Testability Improvement):** `Provide a 'testRuntime(app)' helper that returns a 'TestHarness' capable of asserting on emitted messages, state snapshots, and command resolutions without manual bus setup.`

---

## 4. INTERNAL QUALITY: RISK & EFFICIENCY (Auditor View)

- **4.1. The Critical Flaw:**
    - **Answer:** Potential race conditions in `render()` due to the `clock.setTimeout(..., 0)` scheduling. If multiple messages arrive in one tick, `renderRequested` prevents duplicate renders, but async command resolution might trigger stale renders.
    - **Action Prompt (Risk Mitigation):** `Implement a 'Render Request Queue' or a 'AnimationFrame' style sync that ensures the view() function always operates on the most current model snapshot at the start of the render tick.`

- **4.2. Efficiency Sink:**
    - **Answer:** `normalizeViewOutput` performs recursive layout localization on every frame, even when dimensions haven't changed.
    - **Action Prompt (Optimization):** `Implement 'Retained Layouts' that cache the LocalizedLayoutNode tree, invalidating only on model-driven layout changes or terminal resize.`

- **4.3. Dependency Health:**
    - **Answer:** High. Zero-dependency core. Only uses established peers like `chalk`.
    - **Action Prompt (Dependency Update):** `Verify 'package-lock.json' consistency across the monorepo using 'npm install' and ensure all workspace peers are aligned on the latest TypeScript version.`

---

## 5. STRATEGIC SYNTHESIS & ACTION PLAN (Strategist View)

- **5.1. Combined Health Score (1-10):** 9.0
- **5.2. Strategic Fix:** **Layout Unification**. Extracting geometry from rendering improves both internal parity and DX clarity.
- **5.3. Mitigation Prompt:**
    - **Action Prompt (Strategic Priority):** `Execute RE-022: Create a unified '@flyingrobots/bijou/layout' module that owns all geometry solvers. Refactor splitPane, grid, and flex components to use this engine, ensuring bit-identical layout across all output modes.`
