# v0.11.0 Implementation Tasks — Phases 1, 2 & 3

> **How to use:** Find the first unchecked item (`- [ ]`). Read its description, execute it, then check it off (`- [x]`). Each item is self-contained with enough context to execute without reading prior conversation.

---

## Phase 1: Port Interface Cleanup (ISP)

### 1A. Document audit findings for StylePort

- [x] **Close the "remove dead StylePort methods" task — rgb() and hex() are NOT dead.**

  The roadmap (`docs/ROADMAP.md`, Phase 1) says to audit `rgb()` and `hex()` on `StylePort` and remove if unused. The audit found they ARE used:
  - `packages/bijou/src/core/theme/gradient.ts` calls `style.rgb()` for per-character gradient coloring
  - `packages/bijou/src/core/components/progress.ts` calls `style.rgb()` for gradient fills and `style.hex()` for the empty-segment color

  **Action:** Update the Phase 1 table in `docs/ROADMAP.md`. Change the "Remove dead StylePort methods" row's Notes column to: `Audited — rgb() is used by gradient.ts and progress.ts, hex() by progress.ts. Confirmed not dead; no removal needed.` Add a ~~strikethrough~~ to the task name to mark it done. No code changes.

### 1B. Document audit findings for onResize

- [x] **Close the "audit onResize usage" task — confirmed TUI-only.**

  The roadmap says to verify whether any core bijou component calls `IOPort.onResize()`. The audit found:
  - **Only consumer:** `packages/bijou-tui/src/eventbus.ts:173` — the TEA runtime event bus
  - Zero calls in `packages/bijou/src/` (core package)

  **Action:** Update the Phase 1 table in `docs/ROADMAP.md`. Change the "Audit onResize usage" row's Notes to: `Audited — only called by bijou-tui eventbus.ts. Kept on IOPort (full union) but excluded from core sub-ports (WritePort, QueryPort, InteractivePort).` Add ~~strikethrough~~ to the task name. No code changes.

### 1C. Segregate IOPort into sub-port interfaces

- [x] **Add WritePort, QueryPort, InteractivePort, and FilePort interfaces to `packages/bijou/src/ports/io.ts`.**

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

- [x] **Export WritePort, QueryPort, InteractivePort, and FilePort from `packages/bijou/src/ports/index.ts` and `packages/bijou/src/index.ts`.**

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

- [x] **Run `npx tsc --noEmit -p packages/bijou/tsconfig.json` and `npm test` from repo root. Both must pass with zero errors.**

  The IOPort refactor is purely additive (new super-types extracted, IOPort redefined as their intersection). Structural typing means all existing adapters (`mockIO`, `nodeIO`) satisfy the new interface without any code changes. If anything fails, the sub-port definitions have a signature mismatch — fix the interface, do not change adapter code.

### 1F. Update roadmap to mark Phase 1 complete

- [x] **Update `docs/ROADMAP.md` Phase 1 section.**

  Add ~~strikethrough~~ to the "Segregate IOPort" task name. Update its Notes to: `Done — split into WritePort, QueryPort, InteractivePort, FilePort. IOPort = InteractivePort & FilePort & { onResize }.` All three Phase 1 rows should now be struck through.

### 1G. Commit Phase 1

- [x] **Stage all changes and commit.**

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

---

## Phase 3: Background Color Support (new feature)

Bijou currently has **zero** background color support. `StylePort` is foreground-only, `TokenValue` has no `bg` field, and every component pads with plain transparent spaces. The only workaround is the `inverse` modifier (`badge()` uses it for pills). This phase adds background colors as a first-class concept.

### 3A. Add `bg` field to TokenValue

- [ ] **Add an optional `bg?: string` field to `TokenValue` in `packages/bijou/src/core/theme/tokens.ts`.**

  Current `TokenValue` (line 22-28):
  ```typescript
  export interface TokenValue {
    hex: string;
    modifiers?: TextModifier[];
  }
  ```

  Change to:
  ```typescript
  export interface TokenValue {
    /** Foreground color as a `#rrggbb` hex string. */
    hex: string;
    /** Optional background color as a `#rrggbb` hex string. */
    bg?: string;
    /** Optional text style modifiers to apply alongside the color. */
    modifiers?: TextModifier[];
  }
  ```

  This is backward-compatible — all existing tokens lack `bg` and will behave as before (transparent background). No consumer code changes needed yet.

### 3B. Add bgRgb() and bgHex() to StylePort

- [ ] **Add two new methods to `StylePort` in `packages/bijou/src/ports/style.ts`.**

  Add after the existing `hex()` method:
  ```typescript
  /** Apply a 24-bit RGB background color to text. */
  bgRgb(r: number, g: number, b: number, text: string): string;
  /** Apply a hex background color (e.g. `"#ff00aa"`) to text. */
  bgHex(color: string, text: string): string;
  ```

  This is a **breaking interface change** — all adapters must implement the new methods before the build passes. Steps 3C and 3D add the implementations.

### 3C. Update chalk adapter (bijou-node)

- [ ] **Implement `bgRgb()` and `bgHex()` in `packages/bijou-node/src/style.ts`.**

  In the `chalkStyle()` function, add two new methods to the returned object:

  ```typescript
  bgRgb(r: number, g: number, b: number, text: string): string {
    if (noColor) return text;
    return instance.bgRgb(r, g, b)(text);
  },
  bgHex(color: string, text: string): string {
    if (noColor) return text;
    return instance.bgHex(color)(text);
  },
  ```

  chalk 5.x supports `bgRgb()` and `bgHex()` natively — no extra dependencies.

  Also update `styled()` to apply `token.bg` when present:
  ```typescript
  // After applying foreground hex and modifiers, if token.bg exists:
  if (token.bg && !noColor) {
    result = instance.bgHex(token.bg)(result);
  }
  ```

  Read the existing `styled()` implementation carefully to find the right insertion point. The bg should be applied as the outermost wrap (after fg + modifiers) so ANSI nesting is correct.

### 3D. Update test adapters

- [ ] **Implement `bgRgb()` and `bgHex()` in both test style adapters.**

  **`packages/bijou/src/adapters/test/plain-style.ts`** — add identity implementations:
  ```typescript
  bgRgb(_r: number, _g: number, _b: number, text: string): string { return text; },
  bgHex(_color: string, text: string): string { return text; },
  ```

  **`packages/bijou/src/adapters/test/audit-style.ts`** — add recording implementations:
  ```typescript
  bgRgb(r: number, g: number, b: number, text: string): string {
    _calls.push({ method: 'bgRgb', text, color: [r, g, b] });
    return text;
  },
  bgHex(color: string, text: string): string {
    _calls.push({ method: 'bgHex', text, color });
    return text;
  },
  ```

  Update the `StyledCall` type (or equivalent) in audit-style.ts to include the new method names.

### 3E. Verify build passes with new StylePort methods

- [ ] **Run `npx tsc --noEmit -p packages/bijou/tsconfig.json`, `npx tsc --noEmit -p packages/bijou-node/tsconfig.json`, and `npm test`. All must pass.**

  At this point every adapter satisfies the extended `StylePort`. No component uses bg yet — this is just the plumbing. Existing tests should still pass with zero changes.

### 3F. Add surface tokens to Theme

- [ ] **Add a `surface` section to the `Theme` interface in `packages/bijou/src/core/theme/tokens.ts`.**

  Add after the `ui` field:
  ```typescript
  /** Background surface tokens for panels, regions, and overlays. */
  surface: {
    /** Default content background. */
    primary: TokenValue;
    /** Secondary/sidebar background. */
    secondary: TokenValue;
    /** Elevated surface (cards, dropdowns). */
    elevated: TokenValue;
    /** Overlay/scrim background (modals, drawers). */
    overlay: TokenValue;
    /** Muted/disabled region background. */
    muted: TokenValue;
  };
  ```

  Surface tokens use `TokenValue` — the `hex` field is the foreground text color for content on that surface, and the new `bg` field is the actual background fill. This way `styled(surface.primary, text)` applies both fg and bg.

  Update all theme presets to include `surface` values:
  - **CYAN_MAGENTA** (`packages/bijou/src/core/theme/presets.ts` or wherever presets live)
  - **TEAL_ORANGE_PINK**
  - **NORD**
  - **CATPPUCCIN**

  Choose sensible bg colors for each preset. For example, NORD might use its polar night palette (`#2E3440`, `#3B4252`, `#434C5E`, `#4C566A`). CATPPUCCIN would use its base/mantle/crust colors.

  Also update:
  - `ResolvedTheme` if it needs to expose surface tokens
  - `fromDTCG()` / `toDTCG()` to handle the new surface section
  - `extendTheme()` to allow surface overrides
  - `createResolved()` if it processes theme sections

### 3G. Add bgToken support to box()

- [ ] **Add `bgToken` option to `BoxOptions` in `packages/bijou/src/core/components/box.ts`.**

  Add to the options interface:
  ```typescript
  /** Background fill token. Interior spaces are styled with this token's bg color. */
  bgToken?: TokenValue;
  ```

  Implementation: when `bgToken` is set and mode is `interactive` or `static`:
  1. For each interior line, wrap the padding spaces AND the content line in `ctx.style.styled(bgToken, ...)` — or more precisely, apply `ctx.style.bgHex(bgToken.bg, ...)` to the entire interior width (content + padding).
  2. The border characters themselves should NOT get the background (they have their own `borderToken`).
  3. In `pipe` / `accessible` / `noColor` modes, ignore `bgToken` entirely (interior stays transparent).

  Key detail: each interior line must be padded to the full interior width so the background color fills edge-to-edge. If `width` is set, this is already handled. If not, pad each line to the width of the longest line.

  Write tests:
  - `bgToken` fills interior with bg color in interactive mode
  - `bgToken` ignored in pipe mode
  - `bgToken` ignored when `noColor: true`
  - `bgToken` + `width` work together
  - `bgToken` without `bg` field on token is a no-op (foreground-only token)

### 3H. Add bg support to flex()

- [ ] **Add `bg` option to `FlexChild` and `FlexOptions` in `packages/bijou-tui/src/flex.ts`.**

  On `FlexOptions` (container level):
  ```typescript
  /** Background token applied to the entire flex container (gap + padding areas). */
  bg?: TokenValue;
  ```

  On `FlexChild` (per-child):
  ```typescript
  /** Background token for this child's allocated region (content + child padding). */
  bg?: TokenValue;
  ```

  Implementation: when rendering, if a child has `bg`, wrap each line of that child's content (including its padding) with the background color. For container `bg`, fill gap lines and any remaining container padding with the bg color.

  The bg fill must extend to the full allocated width/height of each region so there are no transparent gaps.

  Write tests:
  - Container bg fills gap areas
  - Child bg fills child padding
  - Mixed: child bg overrides container bg in child region
  - No bg = transparent (existing behavior unchanged)

### 3I. Add bg to overlay primitives

- [ ] **Add `bgToken` option to `modal()`, `toast()`, and `drawer()` in `packages/bijou-tui/src/overlay.ts`.**

  For each overlay function's options interface, add:
  ```typescript
  /** Background fill token for the overlay interior. */
  bgToken?: TokenValue;
  ```

  Implementation: when rendering the overlay interior (inside the border), fill the background with `bgToken.bg` color. This replaces the current transparent spaces between borders.

  The overlay's `renderBox()` helper (or equivalent) is the right place to inject this — it already renders the interior lines. When `bgToken` is set, wrap each interior line with the bg color escape sequences.

  Write tests:
  - Modal with bgToken fills interior
  - Toast with bgToken fills interior
  - Drawer with bgToken fills interior
  - Without bgToken, behavior unchanged (transparent)

### 3J. Graceful degradation for background colors

- [ ] **Ensure background colors degrade correctly across all output modes.**

  Verify (with tests) that:
  - `noColor: true` → all bg methods return text unchanged (already handled by adapter no-ops)
  - `pipe` mode → components skip bgToken (already handled per-component in 3G–3I)
  - `accessible` mode → components skip bgToken
  - Limited color terminals → add `bgRgbToAnsi256()` and `bgRgbToAnsi16()` conversion functions alongside the existing foreground `rgbToAnsi256()` / `rgbToAnsi16()` in `packages/bijou/src/core/theme/downsample.ts`. The ANSI bg codes differ from fg codes (bg256 = `\x1b[48;5;Nm`, bg16 = `\x1b[40-47m` / `\x1b[100-107m`).

  Note: the downsampling functions are pure converters (number → number). The actual ANSI sequence differences are in the adapter layer (chalk handles this automatically). Only add bijou-core downsample functions if there's a concrete consumer that needs them independent of chalk.

### 3K. Write example demonstrating background colors

- [ ] **Create `examples/background-panels/` with a demo showing div-like colored blocks.**

  The example should demonstrate:
  1. A `box()` with `bgToken` creating a colored panel
  2. A `flex()` layout with multiple children, each having a different `bg`
  3. A `modal()` with a filled background over a dimmed main content area
  4. How the same layout degrades in pipe mode (no colors, no backgrounds)

  Follow the existing example pattern: `index.ts` with a `README.md` containing description, run command, and embedded source.

### 3L. Verify full build and test suite

- [ ] **Run type checks for all three packages and full test suite.**

  ```
  npx tsc --noEmit -p packages/bijou/tsconfig.json
  npx tsc --noEmit -p packages/bijou-node/tsconfig.json
  npx tsc --noEmit -p packages/bijou-tui/tsconfig.json
  npm test
  ```

  All must pass. Check specifically that:
  1. DTCG round-trip tests still pass (fromDTCG/toDTCG with new surface section)
  2. Theme preset tests account for the new surface field
  3. All existing component tests are unaffected (no bg = transparent = same as before)

### 3M. Update roadmap and changelog

- [ ] **Update `docs/ROADMAP.md` Phase 3 — strike through completed tasks. Update `docs/CHANGELOG.md` unreleased section.**

  CHANGELOG entry under **Features**:
  ```
  - **Background color support** — new `bg` field on `TokenValue`, `bgRgb()`/`bgHex()` on `StylePort`, `surface` tokens on `Theme`, and `bgToken` option on `box()`, `flex()`, `modal()`, `toast()`, `drawer()` for div-like colored blocks. Degrades gracefully in pipe/accessible/noColor modes.
  ```

### 3N. Commit Phase 3

- [ ] **Stage all Phase 3 changes and commit.**

  ```
  feat(theme): add background color support for div-like colored blocks

  Add background colors as a first-class concept:
  - TokenValue.bg optional field for background hex color
  - StylePort.bgRgb() and bgHex() methods
  - Theme.surface tokens (primary, secondary, elevated, overlay, muted)
  - bgToken option on box(), flex(), modal(), toast(), drawer()

  All adapters updated (chalk, plainStyle, auditStyle).
  Graceful degradation in pipe/accessible/noColor modes.
  ```
