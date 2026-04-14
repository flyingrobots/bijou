---
report_id: "AUD-2026-04-14-SR-V01"
title: "Differential Ship-Readiness Audit: Bijou Runtime and Release Surface"
status: "Final"
audit:
  date_started: 2026-04-14
  date_completed: 2026-04-14
  type: "Differential"
  scope: "runtime, frame shell, text rendering boundary, release-readiness gauntlet, docs/operator readiness"
  compliance_frameworks: []
target:
  repository: "github.com/flyingrobots/bijou"
  branch: "release/v5.0.0"
  commit_hash: "73160b9"
  language_stack: ["TypeScript 5.9.3", "Node.js >=18", "Vitest 4.0.18", "npm workspaces"]
  environment: "Local workspace; full release-readiness run on 2026-04-14"
methodology:
  automated_tools: ["npm run release:readiness", "npm audit --json", "npm outdated --json", "npm run docs:inventory", "rg"]
  manual_review_hours: 5
  false_positive_rate: "Low (<10%)"
summary:
  total_findings: 14
  severity_count:
    critical: 1
    high: 4
    medium: 6
    low: 3
  remediation_status: "Pending"
related_reports:
  previous_audit: "docs/audit/2026-04-11_ship-readiness.md"
  tracking_ticket: "HT-008"
---

# Ready-to-Ship Assessment

Release confidence is materially better than it was on 2026-04-11. On 2026-04-14, `npm run release:readiness` passed end to end: build, lint, typecheck, docs/design-system preflight, DOGFOOD coverage gate, workflow-shell preflight, release preflight, frame regressions, smoke canaries, smoke DOGFOOD, and the full test suite (`3017` tests passed, `12` skipped). `npm audit --json` also returned `0` vulnerabilities. This is no longer a "red build" repo. The remaining risk is concentrated in security-sensitive text handling and teardown semantics rather than broad delivery instability.

## 1. Quality & Maintainability Assessment

### 1.1. Technical Debt Score (1-10)

**Score:** `4/10`

**Justification:**

1. **Shell Monolith:** `packages/bijou-tui/src/app-frame.ts` is still a `2444`-line shell factory with dozens of local helpers and multiple responsibilities.
2. **Split Text Trust Boundary:** The repo sanitizes some text entry points, but not all public surface-native ones, which makes behavior harder to reason about and audit.
3. **Bootstrap/Operator Drift:** The package/docs truth for first-app bootstrap and contributor setup is still inconsistent, increasing handoff cost even though the code itself is mostly green.

### 1.2. Readability & Consistency

**Issue 1:** `createFramedApp()` hides too much control flow in local helpers. `packages/bijou-tui/src/app-frame.ts:645-1631` mixes shell theme publication, retained-layout caching, pane geometry, settings, notifications, and mouse routing in one place, which slows onboarding for any engineer entering the shell code.

**Mitigation Prompt 1:**

```text
Improve `createFramedApp()` readability by extracting the largest closure-local helper groups into named modules: one for retained-layout caching, one for shell input routing, and one for shell-owned settings/notification behavior. Keep the public API unchanged, but make the file read like an orchestrator rather than a dump of private helper functions.
```

**Issue 2:** `packages/bijou-tui/src/layout-node-surface.ts:20-24,55-67,87-97` uses `dx` / `dy` without documenting the coordinate-space meaning. For a new engineer, it is not obvious that these values are localization offsets from potentially negative tree coordinates into a non-negative paint surface.

**Mitigation Prompt 2:**

```text
Rename `dx` / `dy` in `layout-node-surface.ts` to `offsetX` / `offsetY`, add short JSDoc explaining the local-to-surface coordinate-space conversion, and update the callers in `view-output.ts` so localization intent is explicit wherever a tree is translated before paint.
```

**Issue 3:** The onboarding docs disagree on the happy path. `README.md:72-95` teaches manual context wiring, while `packages/bijou-tui/GUIDE.md:23-41` and `packages/bijou-node/README.md:19-35` teach `startApp()`, and `CONTRIBUTING.md:8-12` still says `pnpm install`. That inconsistency hurts engineering handoffs even if the runtime is correct.

**Mitigation Prompt 3:**

```text
Normalize the onboarding language across `README.md`, `packages/bijou-tui/GUIDE.md`, `packages/bijou-node/README.md`, and `CONTRIBUTING.md`. Make `startApp()` the default Node-host bootstrap path everywhere, and update the contributor install command to match the actual npm workspace workflow used by the repo.
```

### 1.3. Code Quality Violation

**Violation 1:** `log()` in `packages/bijou/src/core/components/log.ts:76-120` mixes timestamp formatting, mode branching, badge rendering, and string assembly in one function.

**Original Code Snippet:**

```ts
export function log(level: LogLevel, message: string, options?: LogOptions): string {
  const ctx = resolveCtx(options?.ctx);
  const showPrefix = options?.prefix !== false;
  const showTimestamp = options?.timestamp === true;
  const ts = showTimestamp ? formatTimestamp(ctx) : '';

  if (!ctx) {
    const parts: string[] = [];
    if (ts) parts.push(`[${ts}]`);
    if (showPrefix) parts.push(`[${LABELS[level]}]`);
    parts.push(message);
    return parts.join(' ');
  }

  return renderByMode(ctx.mode, {
    pipe: () => { /* ... */ },
    accessible: () => { /* ... */ },
    interactive: () => { /* ... */ },
  }, options ?? {});
}
```

**Simplified Rewrite 1:**

```ts
function buildLogParts(level: LogLevel, message: string, ts: string, showPrefix: boolean): string[] {
  const parts: string[] = [];
  if (ts) parts.push(ts);
  if (showPrefix) parts.push(LABELS[level]);
  parts.push(message);
  return parts;
}

export function log(level: LogLevel, message: string, options?: LogOptions): string {
  const ctx = resolveCtx(options?.ctx);
  const ts = options?.timestamp ? formatTimestamp(ctx) : '';
  const showPrefix = options?.prefix !== false;

  if (!ctx) return buildLogParts(level, message, ts && `[${ts}]`, showPrefix).join(' ');

  return renderByMode(ctx.mode, {
    pipe: () => buildLogParts(level, message, ts && `[${ts}]`, showPrefix).join(' '),
    accessible: () => buildLogParts(level, message, ts, showPrefix).join(' ').replace(LABELS[level], `${ACCESSIBLE_LABELS[level]}:`),
    interactive: () => renderInteractiveLog(ctx, level, message, ts, showPrefix),
  }, options ?? {});
}
```

**Mitigation Prompt 4:**

```text
Refactor `packages/bijou/src/core/components/log.ts` so `log()` becomes a thin coordinator. Extract helper functions for building plain-text parts and for rendering the interactive badge/timestamp path, then keep the public `log()` API unchanged.
```

**Violation 2:** `normalizeViewOutputInto()` in `packages/bijou-tui/src/view-output.ts:35-74` combines type discrimination, error messaging, size normalization, localization, and painting in one block.

**Original Code Snippet:**

```ts
export function normalizeViewOutputInto(output: ViewOutput, size: ViewportSize, scratch?: Surface): NormalizedViewOutput {
  if (isSurfaceView(output)) {
    // surface path
  }

  if (!isLayoutNodeView(output)) {
    throw new Error('Bijou runtime views must return a Surface or LayoutNode...');
  }

  const localization = localizeLayout(output);
  const width = Math.max(size.width, localization.width, 0);
  const height = Math.max(size.height, localization.height, 0);
  const surface = prepareNormalizedSurface(width, height, scratch);
  paintLayoutNodeWithOffset(surface, output, localization.dx, localization.dy);
  return { kind: 'layout', surface };
}
```

**Simplified Rewrite 2:**

```ts
function normalizeSurfaceOutput(output: Surface, size: ViewportSize, scratch?: Surface): NormalizedViewOutput {
  if (scratch == null) return { kind: 'surface', surface: output };
  const surface = prepareNormalizedSurface(Math.max(size.width, output.width, 0), Math.max(size.height, output.height, 0), scratch);
  surface.blit(output, 0, 0);
  return { kind: 'surface', surface };
}

function normalizeLayoutOutput(output: LayoutNode, size: ViewportSize, scratch?: Surface): NormalizedViewOutput {
  const localization = localizeLayout(output);
  const surface = prepareNormalizedSurface(Math.max(size.width, localization.width, 0), Math.max(size.height, localization.height, 0), scratch);
  paintLayoutNodeWithOffset(surface, output, localization.dx, localization.dy);
  return { kind: 'layout', surface };
}
```

**Mitigation Prompt 5:**

```text
Split `normalizeViewOutputInto()` into explicit surface and layout normalization helpers. Preserve the current runtime error for invalid view outputs, but move discrimination and normalization into smaller functions so the hot path is easier to read and test.
```

**Violation 3:** `scheduleRender()` in `packages/bijou-tui/src/runtime.ts:313-369` handles queueing, flush setup, frame execution, and recursive rescheduling in one nested closure.

**Original Code Snippet:**

```ts
function scheduleRender(): void {
  if (renderHandle != null || renderInFlight) return;

  const scheduledHandle = clock.setTimeout(() => {
    if (renderHandle === scheduledHandle) {
      renderHandle = null;
    }
    scheduledHandle.dispose();
    if (!renderQueued) return;
    renderInFlight = true;
    renderQueued = false;
    try {
      // build RenderState and execute pipeline
    } finally {
      renderInFlight = false;
      if (renderQueued) scheduleRender();
    }
  }, 0);

  renderHandle = scheduledHandle;
}
```

**Simplified Rewrite 3:**

```ts
function queueRender(): void {
  renderQueued = true;
  if (renderHandle != null || renderInFlight) return;
  renderHandle = clock.setTimeout(flushRender, 0);
}

function flushRender(): void {
  const handle = renderHandle;
  renderHandle = null;
  handle?.dispose();
  if (!renderQueued) return;

  renderQueued = false;
  renderInFlight = true;
  try {
    executeRenderFrame();
  } finally {
    renderInFlight = false;
    if (renderQueued) queueRender();
  }
}
```

**Mitigation Prompt 6:**

```text
Refactor render scheduling in `packages/bijou-tui/src/runtime.ts` so queuing and flushing are separate functions with one explicit `executeRenderFrame()` helper. Keep the runtime semantics unchanged, but remove the large nested timeout closure and make the shutdown path easier to reason about.
```

## 2. Production Readiness & Risk Assessment

### 2.1. Top 3 Immediate Ship-Stopping Risks (The "Hard No")

**Risk 1:** **Critical** | `packages/bijou/src/core/components/badge.ts`, `packages/bijou/src/core/components/surface-text.ts`

Public surface-native text helpers still write raw user text into cells without passing through `sanitizeTerminalText()`. This is the largest remaining ship risk if any consuming app renders untrusted input in interactive or static modes.

**Mitigation Prompt 7:**

```text
Implement a shared text-sanitization boundary for all public surface-native text helpers. Update `badge()`, `createTextSurface()`, and `createSegmentSurface()` so untrusted text is sanitized or explicitly rejected before it becomes cells, and add regression tests proving that CSI/OSC/DCS payloads cannot reach the terminal output path.
```

**Risk 2:** **High** | `packages/bijou/src/core/components/hyperlink.ts:33-36`

`hyperlink()` interpolates raw `url` and `text` directly into OSC 8 control sequences. A malicious value can break out of the hyperlink payload and inject arbitrary terminal control behavior.

**Mitigation Prompt 8:**

```text
Harden `hyperlink()` by sanitizing or validating both `url` and `text` before building OSC 8 output. Reject embedded ESC/BEL terminators, preserve safe fallback formatting for pipe/accessible modes, and add tests that attempt OSC 8 breakout payloads in both the URL and display text.
```

**Risk 3:** **High** | `packages/bijou-tui/src/runtime.ts:469-491` and `packages/bijou-tui/src/eventbus.ts:430-458`

The runtime quits without awaiting `bus.drain()`. Long-lived async commands can still be pending when the bus is disposed, which makes cleanup timing-dependent and increases the chance of dropped teardown or orphaned effects during shutdown.

**Mitigation Prompt 9:**

```text
Update the runtime shutdown path to await `bus.drain()` before final disposal, with a bounded timeout and test coverage for long-lived commands that register cleanups asynchronously. Preserve fast exits for already-idle apps, but make command teardown deterministic when work is still in flight.
```

### 2.2. Security Posture

**Vulnerability 1:** `hyperlink()` OSC 8 interpolation can be broken by malicious `url` or `text` values (`packages/bijou/src/core/components/hyperlink.ts:33-36`).

**Mitigation Prompt 10:**

```text
Treat `hyperlink()` as a security boundary. Validate the URL and display text, strip or reject terminal control bytes, and centralize the escaping/validation logic in a reusable helper so other OSC/ANSI-producing components can share it.
```

**Vulnerability 2:** Surface-native text builders such as `badge()` and `createTextSurface()` accept raw control characters and bypass the existing `sanitizeTerminalText()` path (`packages/bijou/src/core/components/badge.ts:32-40,79-86`; `packages/bijou/src/core/components/surface-text.ts:72-99,105-130`).

**Mitigation Prompt 11:**

```text
Introduce a trusted/untrusted text contract for surface-native rendering. All public APIs that accept arbitrary strings should default to untrusted mode and sanitize control sequences before cell writes, while an explicit trusted/styled path can preserve ANSI where that is intentional. Add a shared test matrix across badge, surface-text, and any component that delegates to them.
```

### 2.3. Operational Gaps

**Gap 1:** `release:readiness` does not currently run `npm audit` or `npm run docs:inventory`; both had to be checked manually during this audit.

**Gap 2:** There is no first-class trusted-text type, linter, or audit tool that forces public text-bearing APIs through the same terminal-safety boundary.

**Gap 3:** Runtime shutdown does not emit structured telemetry or timeout diagnostics for pending commands/effects that are still alive during quit.

## 3. Final Recommendations & Next Step

### 3.1. Final Ship Recommendation

**YES, BUT...**

Ship is reasonable for controlled or trusted input because the release gauntlet is green and the dependency audit is clean. Do not treat the current public text surface as safe for untrusted content until the remaining terminal-control-sequence boundary is unified.

### 3.2. Prioritized Action Plan

- **Action 1 (High Urgency):** Close the surface-native control-sequence injection boundary across `badge()`, `surface-text`, and `hyperlink()`.
- **Action 2 (Medium Urgency):** Make runtime shutdown drain pending commands before disposal and instrument lingering cleanups.
- **Action 3 (Low Urgency):** Continue decomposing `createFramedApp()` into explicit extension seams or, at minimum, publish one operator-facing extension guide that matches the code.
