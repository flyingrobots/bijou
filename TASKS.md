# v0.11.0 Implementation Tasks — Phases 1 & 2

> **How to use:** Find the first unchecked item (`- [ ]`). Read its description, execute it, then check it off (`- [x]`). Each item is self-contained with enough context to execute without reading prior conversation.

---

## Phase 1: Port Interface Cleanup (ISP)

### 1A. Document audit findings for StylePort

- [ ] **Close the "remove dead StylePort methods" task — rgb() and hex() are NOT dead.**

  The roadmap (`docs/ROADMAP.md`, Phase 1) says to audit `rgb()` and `hex()` on `StylePort` and remove if unused. The audit found they ARE used:
  - `packages/bijou/src/core/theme/gradient.ts` calls `style.rgb()` for per-character gradient coloring
  - `packages/bijou/src/core/components/progress.ts` calls `style.rgb()` for gradient fills and `style.hex()` for the empty-segment color

  **Action:** Update the Phase 1 table in `docs/ROADMAP.md`. Change the "Remove dead StylePort methods" row's Notes column to: `Audited — rgb() is used by gradient.ts and progress.ts, hex() by progress.ts. Confirmed not dead; no removal needed.` Add a ~~strikethrough~~ to the task name to mark it done. No code changes.

### 1B. Document audit findings for onResize

- [ ] **Close the "audit onResize usage" task — confirmed TUI-only.**

  The roadmap says to verify whether any core bijou component calls `IOPort.onResize()`. The audit found:
  - **Only consumer:** `packages/bijou-tui/src/eventbus.ts:173` — the TEA runtime event bus
  - Zero calls in `packages/bijou/src/` (core package)

  **Action:** Update the Phase 1 table in `docs/ROADMAP.md`. Change the "Audit onResize usage" row's Notes to: `Audited — only called by bijou-tui eventbus.ts. Kept on IOPort (full union) but excluded from core sub-ports (WritePort, QueryPort, InteractivePort).` Add ~~strikethrough~~ to the task name. No code changes.

### 1C. Segregate IOPort into sub-port interfaces

- [ ] **Add WritePort, QueryPort, InteractivePort, and FilePort interfaces to `packages/bijou/src/ports/io.ts`.**

  Edit the existing `io.ts` file. Add four new interfaces ABOVE the existing `IOPort` interface. Then redefine `IOPort` as their intersection. The file currently defines `RawInputHandle`, `TimerHandle`, and `IOPort`.

  New interfaces to add (in this order, after `TimerHandle` and before `IOPort`):

  ```typescript
  /**
   * Minimal output-only port.
   *
   * Sufficient for components that only need to write to stdout
   * (e.g. animated spinners, progress bars).
   */
  export interface WritePort {
    /** Write a string to the output stream (typically stdout). */
    write(data: string): void;
  }

  /**
   * Output + line-oriented input port.
   *
   * Extends {@link WritePort} with `question()` for form fallback modes
   * that collect input via readline.
   */
  export interface QueryPort extends WritePort {
    /** Prompt the user for a single line of text input. */
    question(prompt: string): Promise<string>;
  }

  /**
   * Full interactive terminal port.
   *
   * Extends {@link QueryPort} with raw keyboard input and timers
   * for interactive form components and animated output.
   */
  export interface InteractivePort extends QueryPort {
    /**
     * Enter raw-input mode, invoking {@link onKey} for each keypress.
     * @returns A handle whose `dispose()` restores normal input mode.
     */
    rawInput(onKey: (key: string) => void): RawInputHandle;

    /**
     * Start a repeating timer.
     * @returns A handle whose `dispose()` cancels the timer.
     */
    setInterval(callback: () => void, ms: number): TimerHandle;
  }

  /**
   * Filesystem access port for asset and theme loading.
   *
   * Used at initialization time by logo loaders and DTCG theme importers,
   * not during interactive component rendering.
   */
  export interface FilePort {
    /** Read an entire file as a UTF-8 string. */
    readFile(path: string): string;

    /**
     * List directory contents. Directory names MUST include a trailing `/`
     * suffix (e.g. `"src/"`) so consumers can distinguish them from files.
     */
    readDir(path: string): string[];

    /** Join path segments using the platform separator. */
    joinPath(...segments: string[]): string;
  }
  ```

  Then redefine `IOPort` as an intersection that preserves the `onResize` method (TUI-only, not in any sub-port):

  ```typescript
  /**
   * Abstract I/O port for terminal interaction and filesystem access.
   *
   * This is the full union of all I/O sub-ports plus `onResize()`.
   * Most consumers should depend on the narrowest sub-port they need:
   * {@link WritePort}, {@link QueryPort}, {@link InteractivePort}, or {@link FilePort}.
   *
   * @see {@link WritePort} — output only
   * @see {@link QueryPort} — output + line input
   * @see {@link InteractivePort} — output + line input + raw keys + timers
   * @see {@link FilePort} — filesystem access
   */
  export interface IOPort extends InteractivePort, FilePort {
    /**
     * Register a callback invoked when the terminal is resized.
     * @returns A handle whose `dispose()` removes the listener.
     */
    onResize(callback: (cols: number, rows: number) => void): RawInputHandle;
  }
  ```

  Remove the old standalone `IOPort` interface body (its methods are now inherited from the sub-ports + the `onResize` method declared inline). All existing code continues to compile because `IOPort` is structurally identical.

### 1D. Export new sub-port types

- [ ] **Export WritePort, QueryPort, InteractivePort, and FilePort from `packages/bijou/src/ports/index.ts` and `packages/bijou/src/index.ts`.**

  In `ports/index.ts`, change the IOPort export line from:
  ```typescript
  export type { IOPort, RawInputHandle, TimerHandle } from './io.js';
  ```
  to:
  ```typescript
  export type { WritePort, QueryPort, InteractivePort, FilePort, IOPort, RawInputHandle, TimerHandle } from './io.js';
  ```

  In `src/index.ts`, change the ports export block from:
  ```typescript
  export type {
    RuntimePort,
    IOPort,
    RawInputHandle,
    TimerHandle,
    StylePort,
    BijouContext,
  } from './ports/index.js';
  ```
  to:
  ```typescript
  export type {
    RuntimePort,
    WritePort,
    QueryPort,
    InteractivePort,
    FilePort,
    IOPort,
    RawInputHandle,
    TimerHandle,
    StylePort,
    BijouContext,
  } from './ports/index.js';
  ```

### 1E. Verify build and tests pass

- [ ] **Run `npx tsc --noEmit -p packages/bijou/tsconfig.json` and `npm test` from repo root. Both must pass with zero errors.**

  The IOPort refactor is purely additive (new super-types extracted, IOPort redefined as their intersection). Structural typing means all existing adapters (`mockIO`, `nodeIO`) satisfy the new interface without any code changes. If anything fails, the sub-port definitions have a signature mismatch — fix the interface, do not change adapter code.

### 1F. Update roadmap to mark Phase 1 complete

- [ ] **Update `docs/ROADMAP.md` Phase 1 section.**

  Add ~~strikethrough~~ to the "Segregate IOPort" task name. Update its Notes to: `Done — split into WritePort, QueryPort, InteractivePort, FilePort. IOPort = InteractivePort & FilePort & { onResize }.` All three Phase 1 rows should now be struck through.

### 1G. Commit Phase 1

- [ ] **Stage all changes and commit.**

  ```
  refactor(ports): segregate IOPort into sub-port interfaces (ISP)

  Split the fat IOPort into four focused sub-ports:
  - WritePort (output only)
  - QueryPort (output + line input)
  - InteractivePort (+ raw keys, timers)
  - FilePort (filesystem access)

  IOPort is now their intersection plus onResize(), preserving full
  backward compatibility. Audit confirmed StylePort.rgb()/hex() are
  actively used (gradient.ts, progress.ts) and onResize() is TUI-only.
  ```

  Update `docs/CHANGELOG.md` unreleased section with a line under a **Changed** heading: `- **ports:** segregate IOPort into WritePort, QueryPort, InteractivePort, FilePort sub-interfaces (ISP cleanup)`.

---

## Phase 2: Form Abstractions (DRY + SRP)

### 2A. Migrate all forms to resolveCtx()

- [ ] **Replace `options.ctx ?? getDefaultContext()` with `resolveCtx(options.ctx)` in all 6 form files.**

  Files to edit (all in `packages/bijou/src/core/forms/`):
  - `confirm.ts` — line 3: remove `import { getDefaultContext }`, add `import { resolveCtx } from '../resolve-ctx.js'`; line 24: `const ctx = resolveCtx(options.ctx)`
  - `input.ts` — line 3: remove `import { getDefaultContext }`, add `import { resolveCtx } from '../resolve-ctx.js'`; line 28: `const ctx = resolveCtx(options.ctx)`
  - `select.ts` — line 5: remove `import { getDefaultContext }`, add `import { resolveCtx } from '../resolve-ctx.js'`; line 29: `const ctx = resolveCtx(options.ctx)`
  - `multiselect.ts` — line 5: remove `import { getDefaultContext }`, add `import { resolveCtx } from '../resolve-ctx.js'`; line 28: `const ctx = resolveCtx(options.ctx)`
  - `filter.ts` — line 5: remove `import { getDefaultContext }`, add `import { resolveCtx } from '../resolve-ctx.js'`; line 75: `const ctx = resolveCtx(options.ctx)`
  - `textarea.ts` — line 5: remove `import { getDefaultContext }`, add `import { resolveCtx } from '../resolve-ctx.js'`; line 36: `const ctx = resolveCtx(options.ctx)`

  Each file also has `import type { BijouContext } from '../../ports/context.js'` — keep this import if BijouContext is referenced elsewhere in the file (e.g. function parameter types), remove only if the sole use was the fallback line.

  Run tests after. Behavior is identical — `resolveCtx()` does `if (ctx) return ctx; return getDefaultContext();` which is the same as `?? getDefaultContext()`.

### 2B. Commit resolveCtx migration

- [ ] **Stage and commit the resolveCtx migration.**

  ```
  refactor(forms): standardize on resolveCtx()
  ```

  Update `docs/CHANGELOG.md` unreleased section: `- **forms:** standardize all form components on shared resolveCtx() helper`.

### 2C. Create form-utils.ts with formatFormTitle()

- [ ] **Create `packages/bijou/src/core/forms/form-utils.ts` and extract `formatFormTitle()`.**

  This is the `? title` formatting pattern duplicated across all forms. There are two variants:

  **Fallback variant** (used in non-interactive modes by select, multiselect, filter, textarea, input, confirm):
  ```typescript
  if (noColor || mode === 'accessible') {
    ctx.io.write(`${options.title}\n`);
  } else {
    ctx.io.write(styledFn(ctx.theme.theme.semantic.info, '? ') + ctx.style.bold(options.title) + '\n');
  }
  ```

  **Interactive variant** (used in render() functions of select, multiselect, filter, textarea):
  ```typescript
  const label = noColor
    ? `? ${options.title}`
    : styledFn(t.theme.semantic.info, '? ') + ctx.style.bold(options.title);
  ```

  Create a single function that handles both:
  ```typescript
  /**
   * Format a form title with the `?` prefix and theme-aware styling.
   *
   * @param title - The form prompt text.
   * @param ctx - Bijou context for styling and mode detection.
   * @returns The formatted title string (no trailing newline).
   */
  export function formatFormTitle(title: string, ctx: BijouContext): string
  ```

  Logic:
  - If `ctx.theme.noColor` or `ctx.mode === 'accessible'`: return `title` (plain, no `?` prefix — the fallback callers add their own newline)
  - Otherwise: return `ctx.style.styled(ctx.theme.theme.semantic.info, '? ') + ctx.style.bold(title)`

  Wait — check the exact patterns in each file before implementing. The fallback variant writes just `title` (no `?`), while interactive writes `? title`. Unify by having the function always return the styled `? title` form, and let the accessible/pipe fallback callers use just `title` directly (or have a `plain` option). Read the actual call sites carefully to get the signature right.

  Update all 6 form files to use `formatFormTitle()` in place of the inline styling logic. Update imports.

### 2D. Extract writeValidationError()

- [ ] **Add `writeValidationError()` to `packages/bijou/src/core/forms/form-utils.ts`.**

  The duplicated pattern (found in `input.ts` and `textarea.ts`):
  ```typescript
  if (noColor || mode === 'accessible') {
    ctx.io.write(message + '\n');
  } else {
    ctx.io.write(ctx.style.styled(ctx.theme.theme.semantic.error, message) + '\n');
  }
  ```

  Extract as:
  ```typescript
  /**
   * Write a styled validation error message to the output.
   *
   * Applies `semantic.error` styling in color mode, plain text in
   * noColor/accessible modes.
   *
   * @param message - The error message to display.
   * @param ctx - Bijou context for styling and mode detection.
   */
  export function writeValidationError(message: string, ctx: BijouContext): void
  ```

  Update `input.ts` (required-field check + custom validator block) and `textarea.ts` (same two blocks) to call `writeValidationError()` instead of inline styling. Remove the local `noColor` variable from those blocks if it becomes unused.

### 2E. Extract renderNumberedOptions()

- [ ] **Add `renderNumberedOptions()` to `packages/bijou/src/core/forms/form-utils.ts`.**

  The duplicated pattern (found in fallback modes of `select.ts`, `multiselect.ts`, `filter.ts`):
  ```typescript
  for (let i = 0; i < options.options.length; i++) {
    const opt = options.options[i]!;
    const desc = opt.description ? ` \u2014 ${opt.description}` : '';
    ctx.io.write(`  ${i + 1}. ${opt.label}${desc}\n`);
  }
  ```

  `filter.ts` omits descriptions but the options type still has them — just include descriptions when present.

  Extract as:
  ```typescript
  /**
   * Render a numbered list of options to the output.
   *
   * Used by form fallback modes (select, multiselect, filter) when
   * interactive arrow-key navigation is unavailable.
   *
   * @param options - Array of options with `label` and optional `description`.
   * @param ctx - Bijou context for output.
   */
  export function renderNumberedOptions(
    options: ReadonlyArray<{ label: string; description?: string }>,
    ctx: BijouContext,
  ): void
  ```

  Update `select.ts`, `multiselect.ts`, and `filter.ts` fallback functions to call `renderNumberedOptions()`.

### 2F. Extract terminalRenderer()

- [ ] **Add `terminalRenderer()` to `packages/bijou/src/core/forms/form-utils.ts`.**

  This is the largest extraction. The ANSI cursor control pattern is duplicated ~40 lines per interactive form across `select.ts`, `multiselect.ts`, `filter.ts`, `textarea.ts`.

  The common sequences:
  - Hide cursor: `ctx.io.write('\x1b[?25l')`
  - Show cursor: `ctx.io.write('\x1b[?25h')`
  - Clear current line: `ctx.io.write('\x1b[K')`  (or `\r\x1b[K`)
  - Move cursor up N lines: `ctx.io.write(\`\x1b[${n}A\`)`
  - Clear N lines (erase block + return cursor): loop `write('\x1b[K\n')` N times then move up N

  Extract as:
  ```typescript
  /**
   * ANSI terminal rendering utilities for interactive form components.
   *
   * Provides cursor control helpers that replace the duplicated raw ANSI
   * escape sequences scattered across form interactive modes.
   */
  export interface TerminalRenderer {
    /** Hide the terminal cursor. */
    hideCursor(): void;
    /** Show the terminal cursor. */
    showCursor(): void;
    /** Clear the current line and write text followed by a newline. */
    writeLine(text: string): void;
    /** Move the cursor up by the given number of lines. */
    moveUp(lines: number): void;
    /** Clear a block of N lines and return the cursor to the top of the block. */
    clearBlock(lineCount: number): void;
  }

  /**
   * Create a {@link TerminalRenderer} that writes ANSI escape sequences
   * to `ctx.io`.
   *
   * @param ctx - Bijou context for I/O access.
   * @returns A renderer with cursor control methods.
   */
  export function terminalRenderer(ctx: BijouContext): TerminalRenderer
  ```

  Update each interactive form to use `const term = terminalRenderer(ctx)` and replace raw ANSI writes with `term.hideCursor()`, `term.writeLine(...)`, `term.clearBlock(n)`, `term.showCursor()`. Read each file's render/clearRender/cleanup carefully — the line counts vary (select uses `options.length + 1`, textarea uses `height + 2`, filter uses a dynamic `renderLineCount()`). The `clearBlock` helper handles the common "clear N lines and move up" pattern; the per-form line-count calculation stays in the form.

### 2G. Extract formDispatch()

- [ ] **Add `formDispatch()` to `packages/bijou/src/core/forms/form-utils.ts`.**

  The duplicated entry-point pattern (found in `select.ts`, `multiselect.ts`, `filter.ts`, `textarea.ts`):
  ```typescript
  const ctx = resolveCtx(options.ctx);
  if (ctx.mode === 'interactive' && ctx.runtime.stdinIsTTY) {
    return interactiveXxx(options, ctx);
  }
  return fallbackXxx(options, ctx);
  ```

  Extract as:
  ```typescript
  /**
   * Route a form to its interactive or fallback handler based on
   * output mode and TTY state.
   *
   * @param ctx - Resolved bijou context.
   * @param interactive - Handler for interactive TTY mode.
   * @param fallback - Handler for non-interactive / pipe / accessible modes.
   * @returns The result from whichever handler was selected.
   */
  export function formDispatch<T>(
    ctx: BijouContext,
    interactive: (ctx: BijouContext) => Promise<T>,
    fallback: (ctx: BijouContext) => Promise<T>,
  ): Promise<T>
  ```

  Update `select.ts`, `multiselect.ts`, `filter.ts`, `textarea.ts` to use `formDispatch()`. Note: `input.ts` and `confirm.ts` have simpler branching (no separate interactive function) and may not benefit — skip them unless the pattern fits cleanly.

  Pre-validation (like `filter`'s empty-options check and `select`'s empty-options check) stays BEFORE the `formDispatch` call in the public entry-point function.

### 2H. Write tests for form-utils.ts

- [ ] **Create `packages/bijou/src/core/forms/form-utils.test.ts` with unit tests for all extracted utilities.**

  Use `createTestContext()` from `../../adapters/test/index.js` for all tests.

  Test cases:
  - **formatFormTitle()**
    - returns plain title when `noColor: true`
    - returns plain title when `mode: 'accessible'`
    - returns styled `? title` with semantic.info + bold in interactive mode
    - handles empty string title

  - **writeValidationError()**
    - writes plain message + newline when `noColor: true`
    - writes styled message with semantic.error when color enabled
    - verify output via `ctx.io.written`

  - **renderNumberedOptions()**
    - renders numbered list with labels
    - includes descriptions when present
    - omits description suffix when description is undefined
    - handles empty array (writes nothing)

  - **terminalRenderer()**
    - `hideCursor()` writes `\x1b[?25l`
    - `showCursor()` writes `\x1b[?25h`
    - `writeLine(text)` writes `\r\x1b[K` + text + `\n`
    - `moveUp(3)` writes `\x1b[3A`
    - `clearBlock(3)` writes 3x `\x1b[K\n` then `\x1b[3A`

  - **formDispatch()**
    - calls interactive handler when mode=interactive and stdinIsTTY=true
    - calls fallback handler when mode=interactive but stdinIsTTY=false
    - calls fallback handler when mode=pipe
    - calls fallback handler when mode=accessible
    - calls fallback handler when mode=static

### 2I. Export form-utils from forms barrel (if needed)

- [ ] **Check whether `formatFormTitle`, `writeValidationError`, `renderNumberedOptions`, `terminalRenderer`, and `formDispatch` need to be exported from `packages/bijou/src/core/forms/index.ts` and `packages/bijou/src/index.ts`.**

  These are internal helpers for form components, NOT public API. They should be importable within the package (`../form-utils.js`) but do NOT need to be in the public barrel exports. Only add to `index.ts` exports if there's a concrete use case for consumers (e.g. building custom form components). Default: do NOT export publicly.

### 2J. Verify build and full test suite

- [ ] **Run `npx tsc --noEmit -p packages/bijou/tsconfig.json` and `npm test` from repo root. Both must pass with zero errors.**

  Verify that:
  1. Type checking passes (no import errors, no signature mismatches)
  2. All existing form tests still pass (behavior unchanged)
  3. New form-utils tests pass
  4. No regressions in component tests

### 2K. Update roadmap to mark Phase 2 progress

- [ ] **Update `docs/ROADMAP.md` Phase 2 section.**

  Add ~~strikethrough~~ to each completed task row:
  - ~~Extract `formDispatch()` helper~~
  - ~~Extract `terminalRenderer()` utility~~
  - ~~Extract `renderNumberedOptions()`~~
  - ~~Extract `formatFormTitle()`~~
  - ~~Extract `writeValidationError()`~~
  - ~~Standardize on `resolveCtx()`~~

### 2L. Commit Phase 2

- [ ] **Stage all Phase 2 changes and commit.**

  ```
  refactor(forms): extract shared form utilities (DRY)

  Create form-utils.ts with five shared helpers extracted from
  duplicated code across select, multiselect, filter, textarea,
  input, and confirm:
  - formatFormTitle() — styled "? title" prompt
  - writeValidationError() — mode-aware error display
  - renderNumberedOptions() — numbered fallback list
  - terminalRenderer() — ANSI cursor control
  - formDispatch() — interactive vs fallback routing

  Also migrated all forms from manual getDefaultContext() to resolveCtx().
  ```

  Update `docs/CHANGELOG.md` unreleased section under **Changed**: `- **forms:** extract shared form utilities (formatFormTitle, writeValidationError, renderNumberedOptions, terminalRenderer, formDispatch) to eliminate cross-form duplication`.

  Bump version if appropriate (this is an internal refactor with no public API changes, so a patch bump to the next prerelease or just leaving it unreleased is fine — follow the project's versioning convention).
