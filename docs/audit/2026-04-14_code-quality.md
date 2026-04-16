---
report_id: "AUD-2026-04-14-CQ-V01"
title: "Differential Code Quality Audit: Bijou Monorepo"
status: "Final"
audit:
  date_started: 2026-04-14
  date_completed: 2026-04-14
  type: "Differential"
  scope: "README.md, CONTRIBUTING.md, packages/bijou*, packages/bijou-node, packages/bijou-tui, release-readiness evidence"
  compliance_frameworks: []
target:
  repository: "github.com/flyingrobots/bijou"
  branch: "release/v5.0.0"
  commit_hash: "73160b9"
  language_stack: ["TypeScript 5.9.3", "Node.js >=18", "Vitest 4.0.18", "npm workspaces"]
  environment: "Local workspace with release-readiness gauntlet"
methodology:
  automated_tools: ["npm run release:readiness", "npm audit --json", "npm outdated --json", "npm run docs:inventory", "rg"]
  manual_review_hours: 4
  false_positive_rate: "Low (<10%)"
summary:
  total_findings: 11
  severity_count:
    critical: 1
    high: 4
    medium: 5
    low: 1
  remediation_status: "Pending"
related_reports:
  previous_audit: "docs/audit/2026-04-11_code-quality.md"
  tracking_ticket: "HT-008"
---

# Code Quality Audit

This is a differential pass against the 2026-04-11 audit. As of 2026-04-14, the release gauntlet is green, the branch is `release/v5.0.0`, and `release:preflight` still reports the lock-step package version as `4.4.1`. Several earlier concerns are now closed: crash post-mortem surfaces exist in `packages/bijou-tui/src/runtime.ts`, `scopedNodeIO()` exists in `packages/bijou-node/src/io.ts`, and the typed-example documentation debt has already been retired.

## 0. Executive Report Card

|**Metric**|**Score (1-10)**|**Recommendation**|
|---|---:|---|
|**Developer Experience (DX)**|8|**Best of:** The codebase now has a real first-app host API in `startApp()` plus a first-class test harness in `testRuntime()`.|
|**Internal Quality (IQ)**|7|**Watch Out For:** `createFramedApp()` still concentrates too much shell behavior in one closure, and the terminal-content trust boundary is still split across multiple component paths.|
|**Overall Recommendation**|**THUMBS UP**|**Justification:** Bijou is structurally strong and test-rich, but the next quality win should unify trusted text handling and continue decomposing the frame shell.|

## 1. DX: Ergonomics & Interface Clarity

### 1.1. Time-to-Value (TTV) Score (1-10)

**Answer:** `7/10`. The CLI path is fast, but the public root quick start still teaches manual `initDefaultContext()` + `run(app)` wiring in `README.md:72-95` even though the repo now ships `startApp()` as the preferred Node-host bootstrap in `packages/bijou-node/src/index.ts:125-140`, `packages/bijou-node/README.md:7-35`, and `packages/bijou-tui/GUIDE.md:21-41`. The single biggest piece of setup boilerplate is still low-level host bootstrap and ambient context registration in the first-app path.

**Action Prompt (TTV Improvement):**

```text
Refactor Bijou's first-app path around one canonical Node-host bootstrap. Keep `startApp()` as the implementation anchor, de-emphasize `initDefaultContext() + run(app)` in front-door examples, and add a small convenience wrapper or starter helper for framed apps so a new user can go from install to first interactive frame in one call. Preserve the lower-level `run(app, { ctx })` path for advanced hosts, but make the default path obvious in both code and docs.
```

### 1.2. Principle of Least Astonishment (POLA)

**Answer:** The most obvious interface surprise is the asymmetry between `vstackSurface(...content)` and `hstackSurface(gap, ...content)` in `packages/bijou-tui/src/surface-layout.ts:25-63`. A developer will intuitively expect stack helpers to share the same argument shape, ideally an options object with `gap` on both axes. Right now only the horizontal helper takes a positional configuration argument, which makes call sites ambiguous and harder to autocomplete correctly.

**Action Prompt (Interface Refactoring):**

```text
Update the surface stack helpers so vertical and horizontal stacking use one consistent public contract. Add overloads such as `vstackSurface({ gap }, ...content)` and `hstackSurface({ gap }, ...content)`, keep the old `hstackSurface(gap, ...content)` signature temporarily as a deprecated compatibility path, and update all docs/examples to use the symmetric options-object form.
```

### 1.3. Error Usability

**Answer:** `segmentSurfaceText()` currently throws `createTextSurface does not yet support wide graphemes like "…" in surface rendering.` in `packages/bijou/src/core/components/surface-text.ts:46-52`. That explains what failed, but not what to do next. The actionable version should explicitly tell the caller to use `stringToSurface()`, `contentSurface()`, or another bridge that supports wide glyphs and untrusted text, and it should point to the relevant guide.

**Action Prompt (Error Handling Fix):**

```text
Improve the wide-grapheme error raised by `segmentSurfaceText()` so it recommends the supported fallback path. Keep the failure, but change the message to explain that `createTextSurface()` is for narrow, pre-sanitized surface text only and that callers should use `stringToSurface()` or `contentSurface()` for emoji, other wide glyphs, or untrusted input. Add a docs link or guide reference in the message and cover it with tests.
```

## 2. DX: Documentation & Extendability

### 2.1. Documentation Gap

**Answer:** The highest-friction missing document is a single operator-facing guide for `createFramedApp()` extension seams. The relevant behavior is spread across `packages/bijou-tui/README.md`, `packages/bijou-tui/GUIDE.md`, multiple strategy notes, and the giant implementation surface in `packages/bijou-tui/src/app-frame.ts:645-1631`. A developer can learn what the shell does, but not quickly how to extend it safely without reading implementation code.

**Action Prompt (Documentation Creation):**

```text
Draft a dedicated `createFramedApp()` extension guide that explains page routing, shell-owned notifications/settings, pane input ownership, retained-layout behavior, and the difference between page commands and shell commands. Put it in the main docs path, cross-link it from `packages/bijou-tui/README.md` and `GUIDE.md`, and include one minimal example plus one advanced example that customizes the shell without patching core source.
```

### 2.2. Customization Score (1-10)

**Answer:** `7/10`. The strongest extension point is the render/runtime composition model: `configurePipeline()`, middleware registration, and `testRuntime()` give external users legitimate seams. The weakest point is shell customization inside `createFramedApp()`, where page routing, settings, notification center behavior, retained layout caching, and mouse hit-testing are closure-local in `packages/bijou-tui/src/app-frame.ts:645-1631`. That makes non-breaking extension feel fragile compared to the rest of the repo.

**Action Prompt (Extension Improvement):**

```text
Refactor `createFramedApp()` so external shell customization goes through an explicit extension surface instead of ad hoc closure-local hooks. Introduce a small `FrameExtension` or `FramePlugin` contract for registering shell-owned commands, layer metadata, and input routing contributions. Keep the existing options object source-compatible, but internally route those behaviors through the new extension abstraction.
```

## 3. Internal Quality: Architecture & Maintainability

### 3.1. Technical Debt Hotspot

**Answer:** The highest-concentration hotspot is `packages/bijou-tui/src/app-frame.ts`. It is `2444` lines long and declares dozens of local helpers around one factory (`packages/bijou-tui/src/app-frame.ts:645-1631` alone spans shell-theme publication, key routing, layout retention, pane geometry, settings, and mouse-routing helpers). The file still has too much coupling between shell state, layout retention, and input control flow to be cheap to change.

**Action Prompt (Debt Reduction):**

```text
Incrementally decompose `packages/bijou-tui/src/app-frame.ts` without changing the public `createFramedApp()` API. First extract pure modules for shell input routing, workspace retained-layout caching, and settings/notification-center state transitions. Then keep `createFramedApp()` as a thin orchestrator that composes those pieces. Add focused unit tests around the extracted modules before moving more behavior.
```

### 3.2. Abstraction Violation

**Answer:** `packages/bijou-tui/src/runtime.ts` still mixes TEA host lifecycle, screen enter/exit, mouse toggling, crash presentation, render scheduling, and pipeline execution in one module (`runtime.ts:289-497`). The scheduler and crash surface are not the same concern as the session host. The code would be cleaner if the runtime owned collaborators such as a `RenderScheduler` and `CrashPresenter` rather than doing everything inline.

**Action Prompt (SoC Refactoring):**

```text
Extract the non-TEA host concerns out of `packages/bijou-tui/src/runtime.ts`. Create a dedicated `RenderScheduler` service for queued/in-flight render state and a `CrashPresenter` service for fatal runtime surfaces. Keep `run()` as the public entry point, but make it compose those new collaborators instead of owning scheduling and crash rendering directly.
```

### 3.3. Testability Barrier

**Answer:** The primary testability barrier is closure-heavy private logic. The EventBus already exposes `drain()` (`packages/bijou-tui/src/eventbus.ts:430-437`) and the driver uses it, but the runtime and frame shell keep core routing/layout behavior private, forcing tests into large integration setups instead of pure state-table tests. `createFramedApp()` and `run()` both hide too much behavior behind local functions for cheap mocking.

**Action Prompt (Testability Improvement):**

```text
Improve testability by extracting pure reducers/services from `createFramedApp()` and `run()`. Pull shell input routing, retained-layout cache matching, and render-queue state into standalone modules with explicit inputs/outputs. Then update the higher-level integration tests to rely on those modules for focused behavior coverage while keeping only a thin set of end-to-end frame/runtime tests.
```

## 4. Internal Quality: Risk & Efficiency

### 4.1. The Critical Flaw

**Answer:** The most severe hidden risk is the incomplete terminal-content trust boundary. The plain-text bridges sanitize control sequences in `packages/bijou/src/core/render/differ.ts`, but several public surface-native helpers still write raw graphemes directly into cells: `badge()` in `packages/bijou/src/core/components/badge.ts:32-40,79-86`, `createTextSurface()` / `createSegmentSurface()` in `packages/bijou/src/core/components/surface-text.ts:72-99,105-130`, and raw OSC 8 interpolation in `packages/bijou/src/core/components/hyperlink.ts:33-36`. That means untrusted content can still reach the terminal output path as control bytes on interactive/static surfaces.

**Action Prompt (Risk Mitigation):**

```text
Implement one shared trusted-text boundary for all public text-bearing helpers. Add a low-level sanitizer/validator that every surface-native text API must use before writing cells, distinguish trusted styled text from ordinary untrusted text, and update `badge()`, `createTextSurface()`, `createSegmentSurface()`, `hyperlink()`, and any transitive callers such as markdown/link rendering to use that shared boundary. Add regression tests for CSI, OSC, DCS, BEL, and mixed control-sequence payloads.
```

### 4.2. Efficiency Sink

**Answer:** The generic runtime still recalculates layout bounds and repaints translated trees every render. `packages/bijou-tui/src/view-output.ts:65-69,95` calls `localizeLayout()` / `localizeLayoutNode()`, which recursively measure and translate the full tree in `packages/bijou-tui/src/layout-node-surface.ts:45-97`. The frame shell has a retained-layout cache, but the general runtime path does not, so stable layout trees still pay repeated recursive localization costs.

**Action Prompt (Optimization):**

```text
Optimize layout normalization by introducing a retained localized-layout cache for the general runtime path. Cache the result of layout-bound measurement/localization by view identity plus viewport size, invalidate on resize or structural view changes, and reuse the localized tree/scratch surface when the layout is unchanged. Preserve current behavior but remove repeated recursive localization work on steady frames.
```

### 4.3. Dependency Health

**Answer:** Dependency health is currently strong. `npm audit --json` on 2026-04-14 returned `0` vulnerabilities. The only meaningful drift is minor-version lag in dev tooling: `vitest` `4.0.18 -> 4.1.4`, `@types/node` `22.19.11 -> 22.19.17`, and `fast-check` `4.5.3 -> 4.6.0` per `npm outdated --json` on 2026-04-14. No critical dependency is currently outdated in a way that threatens ship safety.

**Action Prompt (Dependency Update):**

```text
Perform a safe dependency maintenance pass focused on non-breaking dev-tool updates. Update `vitest`, `@types/node`, and `fast-check` to the latest compatible stable versions, run the full `npm run release:readiness` gauntlet afterward, and document any breaking API or snapshot changes before considering larger moves such as a TypeScript 6 migration.
```

## 5. Strategic Synthesis & Action Plan

### 5.1. Combined Health Score (1-10)

**Answer:** `7/10`

### 5.2. Strategic Fix

**Answer:** Establish a single shared trusted-text surface boundary and route all public text-bearing helpers through it. That is the highest-leverage fix because it improves DX (predictable text behavior, fewer surprises, better error guidance) and internal quality (one security policy, less duplicated cell-writing logic, easier testing).

### 5.3. Mitigation Prompt

**Action Prompt (Strategic Priority):**

```text
Create a shared trusted-text module for Bijou and move all public text-bearing helpers onto it. The module should sanitize or explicitly validate untrusted text before it becomes cells, support an opt-in trusted/styled path for APIs that intentionally preserve ANSI/OSC8 sequences, and provide actionable errors when callers use the wrong path. Update `badge()`, `createTextSurface()`, `createSegmentSurface()`, `hyperlink()`, and any transitive renderers to use the new boundary, then document the contract in the main guides so developers understand when to use plain text, trusted styled text, or explicit ANSI parsing.
```
