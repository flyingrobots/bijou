# v1.6.0 — Terminal Whisperer + Test Audit

Two tracks: new terminal capabilities (F-keys, cursor shapes, underline variants, env accessor cleanup) and a test hardening pass against the acceptance criteria specs in `docs/ROADMAP.md`.

---

## Track A: Terminal Whisperer

### A1. Parse F-keys (F1–F12) in `parseKey()`

**File:** `packages/bijou-tui/src/keys.ts` (lines 35–82)
**Test:** `packages/bijou-tui/src/keys.test.ts`

F-key escape sequences vary by terminal emulator. Support the two dominant encodings:

| Key | xterm (SS3) | vt/linux (CSI) |
|-----|-------------|----------------|
| F1  | `\x1bOP`    | `\x1b[11~`     |
| F2  | `\x1bOQ`    | `\x1b[12~`     |
| F3  | `\x1bOR`    | `\x1b[13~`     |
| F4  | `\x1bOS`    | `\x1b[14~`     |
| F5  | —           | `\x1b[15~`     |
| F6  | —           | `\x1b[17~`     |
| F7  | —           | `\x1b[18~`     |
| F8  | —           | `\x1b[19~`     |
| F9  | —           | `\x1b[20~`     |
| F10 | —           | `\x1b[21~`     |
| F11 | —           | `\x1b[23~`     |
| F12 | —           | `\x1b[24~`     |

- [ ] **Write failing tests first.** Add a `describe('F-keys')` block in `keys.test.ts` with tests for:
  - Each F1–F12 key returns `{ key: 'f1' }` through `{ key: 'f12' }` via CSI `~` encoding
  - F1–F4 also recognized via SS3 (`\x1bO`) encoding
  - Shift+F-key (e.g. `\x1b[1;2P` for Shift+F1) sets `shift: true` — at minimum F1–F4
  - Unknown `\x1b[99~` still returns `'unknown'`
- [ ] **Implement F-key parsing** in `parseKey()`. Add sequence matching before the final `'unknown'` fallback. Use a lookup map for CSI `~` sequences and SS3 sequences.
- [ ] **Verify all tests pass:** `npx vitest run packages/bijou-tui/src/keys.test.ts`

### A2. Cursor manager — shape and style control

**File:** `packages/bijou-tui/src/screen.ts`
**Test:** `packages/bijou-tui/src/screen.test.ts`

DECSCUSR (DEC Set Cursor Style) sequences: `\x1b[{n} q` where `n` is:

| n | Style |
|---|-------|
| 0 | Default (reset to terminal default) |
| 1 | Blinking block |
| 2 | Steady block |
| 3 | Blinking underline |
| 4 | Steady underline |
| 5 | Blinking bar |
| 6 | Steady bar |

- [ ] **Write failing tests first.** Add tests in `screen.test.ts` for:
  - `setCursorStyle('block')` writes `\x1b[2 q`
  - `setCursorStyle('block', { blink: true })` writes `\x1b[1 q`
  - `setCursorStyle('underline')` writes `\x1b[4 q`
  - `setCursorStyle('underline', { blink: true })` writes `\x1b[3 q`
  - `setCursorStyle('bar')` writes `\x1b[6 q`
  - `setCursorStyle('bar', { blink: true })` writes `\x1b[5 q`
  - `resetCursorStyle()` writes `\x1b[0 q`
  - Convenience constants: `CURSOR_BLOCK`, `CURSOR_UNDERLINE`, `CURSOR_BAR`, `CURSOR_RESET`
- [ ] **Implement** `setCursorStyle(shape, options?)` and `resetCursorStyle()` in `screen.ts`. Add `CursorShape` type (`'block' | 'underline' | 'bar'`). Export constants and functions from `index.ts`.
- [ ] **Export from barrel.** Add new exports to `packages/bijou-tui/src/index.ts` under the Screen control section.
- [ ] **Verify all tests pass:** `npx vitest run packages/bijou-tui/src/screen.test.ts`

### A3. Underline variants — text decoration expansion

Three files to touch:
- **Token type:** `packages/bijou/src/core/theme/tokens.ts` — `TextModifier` type (line ~19)
- **StylePort:** `packages/bijou/src/ports/style.ts` — interface definition
- **Chalk adapter:** `packages/bijou-node/src/style.ts` — `applyModifiers()` (line ~46)
- **Test adapters:** `packages/bijou/src/adapters/test/style.ts` (plainStyle), `packages/bijou/src/adapters/test/audit-style.ts` (auditStyle)

Modern terminals (kitty, iTerm2, WezTerm, Windows Terminal) support SGR underline variants:
- `\x1b[4m` — standard underline (SGR 4)
- `\x1b[4:3m` — curly underline (SGR 4:3)
- `\x1b[4:4m` — dotted underline (SGR 4:4)
- `\x1b[4:5m` — dashed underline (SGR 4:5)

- [ ] **Write failing tests first.**
  - In `packages/bijou/src/core/theme/tokens.test.ts` (or `types.test.ts`): verify `'underline'`, `'curly-underline'`, `'dotted-underline'`, `'dashed-underline'` are valid `TextModifier` values.
  - In `packages/bijou-node/src/style.test.ts`: verify chalk adapter applies underline modifiers (chalk supports `.underline`; for variants, use raw SGR sequences via chalk's `.rgb()` or direct ANSI wrapping).
  - In `packages/bijou/src/adapters/test/style.test.ts`: verify `plainStyle()` returns text unchanged for underline modifiers. Verify `auditStyle()` records underline modifier calls.
- [ ] **Add `'underline' | 'curly-underline' | 'dotted-underline' | 'dashed-underline'` to `TextModifier`** in `tokens.ts`.
- [ ] **Update chalk adapter** `applyModifiers()` in `packages/bijou-node/src/style.ts`:
  - `'underline'` → `chalk.underline`
  - `'curly-underline'` → wrap text with `\x1b[4:3m` ... `\x1b[24m` (chalk doesn't have native curly/dotted/dashed)
  - `'dotted-underline'` → `\x1b[4:4m` ... `\x1b[24m`
  - `'dashed-underline'` → `\x1b[4:5m` ... `\x1b[24m`
- [ ] **Update test adapters** — `plainStyle()` and `auditStyle()` should handle the new modifiers (identity and recording respectively — likely no code change needed if they're generic over `TextModifier`).
- [ ] **Update DTCG interop** if `TextModifier` values are serialized — check `packages/bijou/src/core/theme/dtcg.ts`.
- [ ] **Verify all tests pass:** `npx vitest run packages/bijou/src/core/theme/ packages/bijou-node/src/style.test.ts packages/bijou/src/adapters/test/`

### A4. `detectColorScheme` env accessor refactor

**File:** `packages/bijou/src/core/detect/tty.ts` (lines 69–84)
**Test:** `packages/bijou/src/core/detect/tty.test.ts`

`detectOutputMode` (line 33) creates a closure `const env = runtime ? (key) => runtime.env(key) : (key) => process.env[key]` and uses it throughout. `detectColorScheme` (line 69) does inline `runtime ? runtime.env('COLORFGBG') : process.env['COLORFGBG']` instead.

- [ ] **Write a failing test** (if one doesn't exist) that calls `detectColorScheme(mockRuntime({ env: { COLORFGBG: '0;15' } }))` and verifies `'light'` is returned.
- [ ] **Extract shared `envAccessor(runtime?)` helper** at the top of `tty.ts` — returns `(key: string) => string | undefined`. Use it in both `detectOutputMode` and `detectColorScheme`.
- [ ] **Verify no behavior change:** `npx vitest run packages/bijou/src/core/detect/tty.test.ts`

---

## Track B: Test Audit

Verify each acceptance criteria group in `docs/ROADMAP.md` sections 1–6 against existing tests. For each gap, write the missing test. Do NOT modify implementation code unless a test reveals a genuine bug.

### B1. Form functions audit (ROADMAP section 1)

**Files:** `packages/bijou/src/core/forms/*.test.ts`

- [ ] **Audit confirm():** Check coverage of rich mode (y/Y/yes, n/N/no, Enter default, invalid re-prompt), pipe mode (stdin, empty default), accessible mode (plain text, labels), NO_COLOR. Write any missing tests.
- [ ] **Audit input():** Check coverage of rich mode (placeholder, trim, required, custom validator, re-render), pipe mode (stdin, validation, default), edge cases (long input, multi-byte unicode). Write any missing tests.
- [ ] **Audit select():** Check coverage against all criteria in spec. Most appear covered already. Write any missing tests.
- [ ] **Audit multiselect():** Check coverage of rich mode (checkboxes, space toggle, enter, pre-selected defaults, wrap-around), non-interactive (numbered, comma-separated, range validation), pipe mode. Write any missing tests.
- [ ] **Audit cross-form criteria:** Ctrl+C sentinel, ctx parameter, createTestContext compatibility. Write any missing tests.

### B2. Factory and context management audit (ROADMAP section 2)

**Files:** `packages/bijou/src/factory.test.ts`, `packages/bijou/src/context.ts`

- [ ] **Audit against spec.** Verify all 12 acceptance criteria are covered. Key gaps to check: custom `envVar`, custom `presets` registry, `NO_COLOR` as empty string, `_resetDefaultContextForTesting()`. Write any missing tests.

### B3. Test adapter self-tests audit (ROADMAP section 3)

**Files:** `packages/bijou/src/adapters/test/*.test.ts`

- [ ] **Audit against spec.** Verify all 14 acceptance criteria. Key gaps to check: `env()` for missing keys, `readLine()` throws on exhaustion, `readFile()`/`readDir()` mock filesystem, `createTestContext()` defaults to rich mode. Write any missing tests.

### B4. Node.js adapters audit (ROADMAP section 4)

**Files:** `packages/bijou-node/src/*.test.ts`

- [ ] **Audit against spec.** Verify all 16 acceptance criteria. Key gaps to check: `readLine()` readline integration, `readFile()`/`readDir()` real fs, modifier handling (dim, strikethrough, inverse), `initDefaultContext()` idempotency. Write any missing tests.

### B5. Environment behavior integration audit (ROADMAP section 5)

**Files:** `packages/bijou/src/core/environment.test.ts`, `packages/bijou/src/core/detect/tty.test.ts`

- [ ] **Audit against spec.** Verify all 17 acceptance criteria. Key gaps to check: `gradientText()` NO_COLOR, `theme.ink()` returns undefined, CI+TTY detection, `TERM=dumb`, accessible mode for `box()`, `table()`, `spinnerFrame()`. Write any missing tests.

### B6. DTCG edge-case hardening audit (ROADMAP section 6)

**Files:** `packages/bijou/src/core/theme/dtcg.test.ts`

- [ ] **Audit against spec.** Verify all 8 acceptance criteria. Key gaps to check: nested `{group.token}` references, circular reference detection, unresolvable reference error, missing optional fields, DTCG schema validation, modifier metadata preservation, round-trip for all presets, round-trip for custom theme with all token types. Write any missing tests.

---

## Wrap-up

- [ ] Update `docs/CHANGELOG.md` with `[Unreleased]` section for v1.6.0
- [ ] Bump version to 1.6.0 across all packages
- [ ] Update `docs/ROADMAP.md` — remove shipped P3 items, note test audit complete
- [ ] Final test run: `npx vitest run` from repo root
- [ ] Update TASKS.md — move summary to `docs/COMPLETED.md`
