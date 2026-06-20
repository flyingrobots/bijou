# WF-161 Respecting the Dojo Ratchet 262

## Decision Summary

Cut `100` counted Code Dojo debt items from the merged `362` baseline and land
the next Respecting the Dojo goalpost at `262` aggregate violations or lower.

## Hill

The repository has zero ESLint and mock-ban debt, but it still carries broad
file/context and code-size debt. This cycle removes a large chunk of that debt
without weakening the standards: oversized test/spec files are decomposed into
threshold-sized deterministic specs, and the ledgers are ratcheted down to the
live count.

## Current Truth

- Aggregate Code Dojo debt: `362`
- File/context baseline: `308`
- Mock-ban baseline: `0`
- Code-size baseline: `54`, including `3` hard-limit files
- ESLint baseline: `0`
- Required target for this cycle: `262` aggregate violations or lower
- Tracker issue: #437

## Scope

- Split `91` over-threshold test/spec files into grouped sub-spec files that
  each stay under `150` lines and `12,000` bytes.
- Remove those original files from the file/context baseline.
- Remove the `9` split test/spec files that were also over the `500` line
  code-size ratchet from the code-size baseline.
- Lower `package.json` `code-dojo:debt --max` to the measured live count.
- Update `docs/code-dojo-exceptions.md` and `docs/CHANGELOG.md`.
- Preserve every assertion and public behavior; this is a decomposition pass,
  not a semantic rewrite.

## Non-Goals

- No production API behavior changes.
- No release-version work.
- No rebase, amend, force push, or draft PR.
- No large-file marker escape hatches and no standards carveout expansion.

## Implementation Plan

1. Add deterministic splitting support as a one-time mechanical transform for
   eligible test files:
   - keep imports and helper declarations;
   - group adjacent `it`/`test`/nested `describe` items under the same parent
     `describe`;
   - write each generated spec below file/context limits;
   - delete the original oversized spec file.
2. Run the focused split specs first to prove assertion parity.
3. Recompute Code Dojo file/context and code-size ledgers.
4. Lower the aggregate `code-dojo:debt` ceiling to `262` or lower.
5. Run the full local validation lane before opening the PR for final review.

## Candidate Set

The selected set removes exactly `100` aggregate items:

- `91` file/context entries from oversized test/spec files.
- `9` matching code-size entries from split test/spec files that were also over
  `500` lines:
  - `packages/bijou-tui/src/runtime-engine.test.ts`
  - `packages/bijou/src/core/binding.test.ts`
  - `packages/bijou-tui/src/notification.test.ts`
  - `packages/bijou-tui/src/eventbus.test.ts`
  - `packages/bijou-tui/src/transition-shaders.test.ts`
  - `packages/bijou-i18n/src/runtime.test.ts`
  - `packages/bijou/src/core/theme/dtcg.test.ts`
  - `packages/bijou-tui/src/focus-area.test.ts`
  - `tests/cycles/DF-069/dogfood-block-registry.test.ts`

## Tests And Validation

- Focused Vitest run for all generated split specs.
- `npm run code-dojo:changed`
- `npm run code-dojo:verify`
- `npm run typecheck:test`
- `npm run lint`
- `npm run docs:inventory`
- `git diff --check`
- Full pre-push verification before final PR handoff.

## Acceptance Criteria

- Aggregate Code Dojo debt is `262` or lower.
- File/context baseline is `217` or lower.
- Code-size baseline is `45` or lower.
- Mock-ban and ESLint baselines remain `0`.
- No generated split spec exceeds `150` lines or `12,000` bytes.
- The full local and GitHub validation gates pass.

## Playback Questions

1. Did the aggregate debt fall by at least `100`?
2. Did every split spec preserve its original assertions?
3. Did the split avoid creating new file/context or code-size violations?
4. Did the ledgers and ceiling match the measured live count?
5. Did the PR stay non-draft and linked to issue #437?

## Linked Invariants

- TypeScript standards: `docs/typescript-code-standards.editors-edition.md`
- Code Dojo exception ledger: `docs/code-dojo-exceptions.md`
- Work doctrine: `docs/METHOD.md`
