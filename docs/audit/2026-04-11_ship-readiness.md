# AUDIT: READY-TO-SHIP ASSESSMENT (2026-04-11)

### 1. QUALITY & MAINTAINABILITY ASSESSMENT (EXHAUSTIVE)

1.1. **Technical Debt Score (1-10):** 3
    - **Justification:**
        1. **God Module (`runtime.ts`)**: The main loop handles too many concerns including TEA lifecycle, double-buffering, and raw ANSI escapes.
        2. **Layout Duplication**: Geometric calculation logic is duplicated between string-first and surface-first paths.
        3. **Ambient Context Reliance**: The `getDefaultContext()` pattern, while ergonomic, can lead to brittle tests if not handled via the provided adapters.

1.2. **Readability & Consistency:**
    - **Issue 1:** `runtime.ts` uses manual `setTimeout(..., 0)` for render scheduling, which lacks a formal sync with the event bus.
    - **Mitigation Prompt 1:** `Implement a 'RenderRequest' message type in the EventBus that triggers the render cycle, removing the reliance on manual setTimeout(..., 0) in runtime.ts.`
    - **Issue 2:** Variable naming in `layout-node-surface.ts` (`dx`, `dy`) is terse and lacks semantic context regarding coordinate spaces (local vs. screen).
    - **Mitigation Prompt 2:** `Rename 'dx' and 'dy' to 'offsetX' and 'offsetY' in layout-node-surface.ts and add JSDoc explaining that these represent the translation from local node space to target surface space.`
    - **Issue 3:** The `App` interface view return type `Surface | LayoutNode` is a union that requires constant type-checking in the pipeline.
    - **Mitigation Prompt 3:** `Introduce a 'ViewOutput' wrapper or normalized interface that components must return, reducing the need for 'isSurfaceView' checks throughout the rendering pipeline.`

1.3. **Code Quality Violation:**
    - **Violation 1: God Function (`run`)**: The `run` function in `runtime.ts` is 200+ lines and handles setup, the loop, and teardown.
    - **Violation 2: SRP Violation (`measureLayoutBounds`)**: This function calculates bounds and also implies localization logic.
    - **Violation 3: SRP Violation (`chalkStyle`)**: The style adapter handles color resolution and underline variants (SGR) separately.

### 2. PRODUCTION READINESS & RISK ASSESSMENT (EXHAUSTIVE)

2.1. **Top 3 Immediate Ship-Stopping Risks (The "Hard No"):**
    - **Risk 1: Render Race Condition (High)**: Multiple rapid updates can trigger overlapping `setTimeout` renders if `renderRequested` is reset prematurely.
    - **Mitigation Prompt 7:** `Refactor the render() function in runtime.ts to use a single, stable TimerHandle that is cleared and reset on each request, ensuring only one render is ever in flight.`
    - **Risk 2: Unsanitized Input (Medium)**: Raw ANSI sequences in user-provided strings could break the packed-differ's column tracking.
    - **Mitigation Prompt 8:** `Implement an ANSI-stripping middleware or a 'SafeString' component that ensures user-provided content does not contain destructive escape sequences.`
    - **Risk 3: Exit Signal Leak (Low)**: Double Ctrl+C force-quit might bypass some cleanup logic in async commands.
    - **Mitigation Prompt 9:** `Ensure the shutdown() function in runtime.ts explicitly calls 'bus.dispose()' and waits for all active command cleanup handles to resolve before exiting.`

2.2. **Security Posture:**
    - **Vulnerability 1: Terminal Injection**: Lack of explicit sanitization for content rendered via `markdown()` or `text()`.
    - **Mitigation Prompt 10:** `Add a 'Sanitize' stage to the rendering pipeline that identifies and neutralizes malicious escape sequences before they reach the Diff stage.`
    - **Vulnerability 2: Host Path Disclosure**: `readFile` port in `nodeIO` does not restrict access to the current project root.
    - **Mitigation Prompt 11:** `Implement a 'ScopedIO' adapter that wraps nodeIO and enforces a 'sandbox' root, preventing components from reading sensitive system files.`

2.3. **Operational Gaps:**
    - **Gap 1: Crash Recovery**: No built-in way to restore terminal state (e.g., cursor, mouse) if the Node process is killed externally.
    - **Gap 2: Remote Telemetry**: No standardized way to pipe TUI state/logs to a remote monitoring service.
    - **Gap 3: Performance Budgets**: No CI gate for "Time to First Frame" or "Max Frame Allocation."

### 3. FINAL RECOMMENDATIONS & NEXT STEP

3.1. **Final Ship Recommendation:** **YES, BUT...** (Fix Risk 1 and Risk 2 immediately).

3.2. **Prioritized Action Plan:**
    - **Action 1 (High Urgency):** Stabilize the render scheduling to prevent race conditions.
    - **Action 2 (Medium Urgency):** Extract the Layout Engine into `@flyingrobots/bijou` core.
    - **Action 3 (Low Urgency):** Implement the 'Error Surface' post-mortem.
