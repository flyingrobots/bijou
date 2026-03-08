# v1.7.0 — Test Fortress

Deep audit of test coverage spec vs. actual assertions. Fill every gap, resolve every spec-vs-impl mismatch, add fuzz/stress suites.

---

## Phase 1: Spec-vs-Impl Mismatches (decisions first)

These items require deciding whether to fix the spec or fix the code. Read the source, decide, then update the ROADMAP spec text to match reality.

- [ ] **1a. `mockIO().question()` exhaustion — returns `''` vs spec says "throws".** File: `packages/bijou/src/adapters/test/io.ts:82-85`. The `question()` method uses `answerQueue.shift() ?? ''`, returning empty string when exhausted. The ROADMAP spec (Section 3) says "readLine() throws when queue exhausted." **Decision needed:** If returning `''` is intentional (simulates empty Enter), update the spec. If throwing is better (catches missing test setup), change the implementation. Either way, update `packages/bijou/src/adapters/test/io.test.ts` to assert the chosen behavior and update the ROADMAP Section 3 acceptance criteria to match.

- [ ] **1b. CI+TTY mode — spec says "rich", impl returns `'static'`.** File: `packages/bijou/src/core/detect/tty.ts:43-57`. When `CI` env var is set and stdout is TTY, `detectOutputMode()` returns `'static'`. The ROADMAP spec (Section 5) says "CI=true with TTY still detects as rich mode." The actual behavior is correct — CI environments shouldn't get interactive prompts. **Action:** Update the ROADMAP Section 5 acceptance criteria from "rich mode" to "static mode". Verify the existing test at `packages/bijou/src/core/environment.test.ts` asserts `'static'` (it should already).

- [ ] **1c. Ctrl+C in select/multiselect — fallback value vs sentinel.** Files: `packages/bijou/src/core/forms/select.ts:162-171`, `packages/bijou/src/core/forms/multiselect.ts:169-174`. On Ctrl+C/Escape, `select()` returns `defaultValue ?? options[0].value` and `multiselect()` returns `[]`. The ROADMAP spec (Section 1, "all forms") says "Ctrl+C throws or returns cancellation sentinel." Current behavior is consistent: confirm/input throw (via rejected readline), select/multiselect return fallback values. **Action:** Update the ROADMAP Section 1 "all forms" criterion to: "Ctrl+C cancels gracefully — confirm/input reject with error, select returns default/first value, multiselect returns empty array." Add test assertions for each form's specific Ctrl+C behavior if not already present.

---

## Phase 2: Hard Gaps (missing tests)

### 2a. multiselect() pre-selected defaults

- [ ] **Add test: multiselect pre-selected defaults render as checked in interactive mode.** File: `packages/bijou/src/core/forms/multiselect.test.ts`. The `multiselect()` function accepts `defaultValue` via `SelectFieldOptions<T>` but the implementation at `packages/bijou/src/core/forms/multiselect.ts` **never uses it** in interactive mode — the `selected` Set starts empty regardless. **First:** Write a failing test that creates a multiselect with `defaultValue: ['red', 'blue']` in interactive mode and asserts those items render with filled checkboxes (`●` or `◉`) on first render. **Then:** Fix the implementation to initialize the `selected` Set from `defaultValue` when provided. Verify the test passes.

### 2b. nodeIO() adapter tests

- [ ] **Create `packages/bijou-node/src/io.test.ts`.** The `nodeIO()` function at `packages/bijou-node/src/io.ts` has zero test coverage. Write tests for:
  - `write(data)` — spy on `process.stdout.write`, call `io.write('hello')`, assert spy called with `'hello'`.
  - `writeError(data)` — spy on `process.stderr.write`, call `io.writeError('err')`, assert spy called.
  - `readFile(path)` — create a temp file with known content via `fs.writeFileSync`, call `io.readFile(path)`, assert returned content matches. Clean up temp file in afterEach.
  - `readDir(dirPath)` — create a temp dir with files and a subdir, call `io.readDir(path)`, assert returned entries include filenames and `subdir/` (trailing slash for dirs).
  - `joinPath(...segments)` — call `io.joinPath('a', 'b', 'c')`, assert result is `'a/b/c'` (or platform-appropriate separator).
  - `question()` — this involves readline; test by creating a mock stdin stream, piping a line into it, and asserting the resolved value. Use `Readable.from(['alice\n'])` as mock stdin if feasible, otherwise skip with a `// integration test — requires real TTY` comment.
  - `setInterval()` — call `io.setInterval(spy, 50)`, use `vi.advanceTimersByTime(150)`, assert spy called ~3 times, then call `handle.dispose()` and verify it stops.

### 2c. chalkStyle() adapter tests

- [ ] **Create `packages/bijou-node/src/style.test.ts`.** The `chalkStyle()` function at `packages/bijou-node/src/style.ts` has zero test coverage. Write tests for:
  - `styled(token, text)` with `noColor: false` — pass a token with `hex: '#ff0000'` and no modifiers. Assert result contains ANSI escape codes (match `/\x1b\[/`). Assert result contains the text `'hello'`.
  - `styled(token, text)` with `noColor: true` — same token, assert result is exactly `'hello'` with no ANSI codes.
  - `bold(text)` with `noColor: false` — assert result contains ANSI bold codes (`\x1b[1m`).
  - `bold(text)` with `noColor: true` — assert result is plain text.
  - `rgb(r, g, b, text)` — call `style.rgb(255, 0, 0, 'red')`, assert contains ANSI codes.
  - `hex(color, text)` — call `style.hex('#00ff00', 'green')`, assert contains ANSI codes.
  - `bgRgb(r, g, b, text)` — call `style.bgRgb(0, 0, 255, 'blue')`, assert contains ANSI codes.
  - `bgHex(color, text)` — call `style.bgHex('#0000ff', 'blue')`, assert contains ANSI codes.
  - Modifiers: `styled()` with token containing `modifiers: ['bold']` — assert ANSI bold present. Repeat for `'dim'`, `'strikethrough'`, `'inverse'`, `'underline'`. For `'curly-underline'`, `'dotted-underline'`, `'dashed-underline'` — assert SGR 4:3, 4:4, 4:5 sequences respectively (these are raw escape sequences, not chalk-native).
  - `chalkStyle({ level: 0 })` — force no-color via chalk level, verify plain output regardless of `noColor` flag.

### 2d. input() validation re-render

- [ ] **Add test: input() clears validation error and re-renders after valid input.** File: `packages/bijou/src/core/forms/input.test.ts`. In the interactive mode describe block, add a test that: (1) creates an input with a validator that rejects `'bad'` but accepts `'good'`, (2) queues answers `['bad', 'good']` via mockIO, (3) simulates Enter after each, (4) asserts the error message appears in written output after first answer, AND (5) asserts the final resolved value is `'good'`. The existing test at ~line 134 only checks the error is written, not the recovery.

---

## Phase 3: Fuzz / Stress Suites

Add `fast-check` as a devDependency (`pnpm add -Dw fast-check`) for property-based testing. All fuzz tests go in dedicated `*.fuzz.test.ts` files so they can be run separately (they're slower).

### 3a. Forms fuzz

- [ ] **Create `packages/bijou/src/core/forms/forms.fuzz.test.ts`.** Property-based tests for form input handling:
  - `input()` pipe mode: generate arbitrary strings (including control chars `\x00`–`\x1f`, unicode, empty, very long up to 5000 chars). For each, call `input({ title: 'test', ctx })` with the string queued as the answer. Assert it resolves without throwing (value may be trimmed/empty, but must not crash).
  - `confirm()` pipe mode: generate arbitrary strings. Assert it resolves to `true` or `false` without throwing (invalid input falls back to default).
  - `select()` pipe mode: generate arbitrary strings (including non-numeric, negative, floats, huge numbers). Assert it resolves to one of the option values without throwing.
  - `multiselect()` pipe mode: generate arbitrary strings (including malformed comma lists like `',,1,,abc,2,'`). Assert it resolves to an array without throwing.
  - Rapid repeated calls: run 50 sequential `input()` calls in a loop with random strings, assert all resolve.

### 3b. Environment fuzz

- [ ] **Create `packages/bijou/src/core/detect/tty.fuzz.test.ts`.** Property-based tests for `detectOutputMode()`:
  - Generate random env var maps with keys from `['NO_COLOR', 'CI', 'TERM', 'BIJOU_ACCESSIBLE', 'BIJOU_THEME']` and values from `[undefined, '', '0', '1', 'true', 'dumb', 'xterm-256color', 'garbage']`. Combine with random `stdoutIsTTY: boolean`.
  - For each combo, call `detectOutputMode(mockRuntime({...}))`. Assert the return value is one of `'interactive' | 'pipe' | 'static' | 'accessible'` — never throws.
  - Generate 200+ random combos per run.

### 3c. DTCG fuzz

- [ ] **Create `packages/bijou/src/core/theme/dtcg.fuzz.test.ts`.** Property-based tests for DTCG parsing:
  - Generate random but structurally valid DTCG documents: random hex colors (`#` + 6 random hex digits), random modifier arrays (subset of known modifiers), random gradient stop counts (1–10), random token names.
  - For each, call `toDTCG()` on a theme built from the random values, then `fromDTCG()` on the result. Assert it doesn't throw and produces a valid theme with the expected token count.
  - Generate documents with edge-case hex values: `#000000`, `#ffffff`, `#FFFFFF` (case), 3-digit shorthand `#fff` (should these work?), invalid `#xyz123`. Assert graceful behavior (either parses or throws descriptively, never crashes silently).
  - Generate deeply nested reference chains (depth 5–10) without cycles. Assert resolution succeeds.

---

## Phase 4: Cleanup & Ship

- [ ] **Update ROADMAP test coverage spec.** Mark all 6 sections as complete (strikethrough or move to shipped). Update the "Latest" line to `v1.7.0`. Add v1.7.0 to the shipped milestones table.
- [ ] **Update CHANGELOG `[Unreleased]` section** with all new tests, bug fixes (multiselect defaultValue), and spec corrections.
- [ ] **Version bump** — update all `package.json` files to `1.7.0` (bijou, bijou-node, bijou-tui, bijou-tui-app, create-bijou-tui-app).
- [ ] **Run full test suite** — `pnpm test` from repo root. Zero failures, zero warnings.
- [ ] **Final commit and PR** — branch `feat/v1.7.0-test-fortress`, PR to main.
