# WF-164 Respecting the Dojo Ratchet 62

Legend: [WF — Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor Human

James Ross.

## Sponsor Agent

Codex.

## Decision Summary

Complete issue
[#477](https://github.com/flyingrobots/bijou/issues/477) by removing the second
`25`-violation tranche from the `112` Code Dojo checkpoint and lowering the
encoded aggregate ceiling to `62`.

This is the explicit structural prerequisite for the bounded Profunctor Page
inspection story
[#468](https://github.com/flyingrobots/bijou/issues/468).

## Hill

DX-050 tranche A lowered measured debt from `112` to `87`, but the encoded
ceiling deliberately remained at `112` because the repo goalpost policy
requires one completed checkpoint to remove at least `50` violations. Tranche B
must remove `25` additional counted violations without converting mechanical
module boundaries into new import cycles, API drift, or top-level ordering
bugs.

Ledger edits are evidence after implementation. They are not the
implementation.

## Current Truth

- Aggregate Code Dojo debt before tranche B: `87`
- File/context baseline before tranche B: `61`
- Mock-ban baseline: `0`
- Code-size baseline before tranche B: `26`, including `3` hard-limit files
- ESLint baseline: `0`
- Required target: `62` aggregate violations or lower
- Tracker issue:
  [#477](https://github.com/flyingrobots/bijou/issues/477)
- Downstream issue:
  [#468](https://github.com/flyingrobots/bijou/issues/468)

## Result

- Aggregate Code Dojo debt: `62`
- File/context baseline: `37`
- Mock-ban baseline: `0`
- Code-size baseline: `25`, including `3` hard-limit files
- ESLint baseline: `0`
- Removed tranche-B debt: `25` of the required `25` violations
- Removed combined DX-050 debt: `50` of the required `50` violations
- Next goalpost target: `12` aggregate violations or lower

Twenty-four pre-existing oversized entrypoints are stable facades over focused
modules. `examples/docs/storybook-app.ts` leaves both the file/context and
code-size ledgers, accounting for the twenty-fifth counted violation. No
threshold, exception marker, public export, or runtime-cycle allowance changed.

## Scope

- Select `24` pre-existing file/context offenders with bounded top-level
  responsibilities and existing regression coverage.
- Preserve every selected public entrypoint as a compatibility facade.
- Keep TypeScript overload families in one implementation module.
- Reject extraction candidates whose mutable module state cannot cross a
  standard ECMAScript module boundary safely.
- Remove `examples/docs/storybook-app.ts` from the code-size baseline after its
  focused modules pass the live size gate.
- Lower `package.json` `code-dojo:debt --max` to `62`.
- Update the exception ledger, changelog, roadmap, bearing, and current tests.

## Non-Goals

- No public API redesign.
- No product behavior change.
- No Profunctor Page adapter implementation.
- No release tag or publication.
- No new standards exception or large-file marker.
- No weakened threshold, skipped gate, or aspirational ledger edit.

## Implementation Outline

1. Bind the exact tranche-B root set in a deterministic regression.
2. Split declarations along dependency-aware top-level boundaries.
3. Keep overload declarations and implementations co-located.
4. Preserve public import paths through typed re-export facades.
5. Run focused typecheck, lint, behavior, size, and runtime-cycle checks.
6. Remove ledger entries only after every extracted file satisfies the live
   thresholds.
7. Ratchet the package ceiling and documentation to the measured result.
8. Run the full repository gate before review.

## Tests To Write First

- Assert that the exact `24` roots leave the file/context ledger.
- Assert that `examples/docs/storybook-app.ts` leaves the code-size ledger.
- Assert that every extracted production module is at most `150` lines and
  `12,000` bytes.
- Assert that no tranche-B module participates in a repository runtime import
  cycle.
- Preserve focused behavioral tests for every touched public entrypoint.

## Validation Plan

- `npx vitest run tests/cycles/DX-050/code-dojo-tranche-b.test.ts`
- `npx vitest run tests/cycles/DX-050/split-modules-tranche-b-remain-acyclic.test.ts`
- `npm run code-dojo:verify`
- `npm run typecheck`
- `npm run lint`
- `npm run lint:eslint`
- `npm run docs:inventory`
- `npm run test:run`
- `git diff --check`

## Acceptance Criteria

- Aggregate Code Dojo debt is exactly `62`.
- File/context and code-size ledgers match measured live files.
- Mock-ban and ESLint baselines remain `0`.
- Every selected public entrypoint preserves its export names.
- No extracted module participates in a runtime import cycle.
- No newly created file exceeds `150` lines or `12,000` bytes.
- Full local and GitHub validation gates pass.
- Main at the resulting merge revision unblocks issue #468.

## Playback Questions

1. Did combined DX-050 work remove all `50` required violations?
2. Does every removed ledger entry correspond to a measured file reduction?
3. Did every compatibility facade preserve its public export names?
4. Are all split families absent from runtime import cycles?
5. Is issue #468 unblocked by merged evidence rather than a local claim?

## Accessibility And Assistive Posture

This is a structural standards cycle. Extracted modules preserve current text,
focus, lower-mode, and assistive semantics. No visual or interaction redesign
is in scope.

## Localization And Directionality Posture

Extracted modules preserve catalog keys, localized values, reading order, and
direction-sensitive behavior. Split-source debt identity continues to resolve
numbered parts to their canonical root.

## Agent Inspectability And Explainability Posture

The exact target roots, live threshold checks, runtime-cycle proof, aggregate
ceiling, and current documentation agree. A successor can identify inherited
facades and focused implementation parts without reconstructing the tranche
from commit history.

## Linked Invariants

- [TypeScript Code Standards](../typescript-code-standards.editors-edition.md)
- [Code Dojo Exceptions](../code-dojo-exceptions.md)
- [Work Doctrine](../METHOD.md)
- [Documentation Standards](../DOCUMENTATION_STANDARDS.md)
- Tracker issue:
  [#477](https://github.com/flyingrobots/bijou/issues/477)

## Retrospective And Closeout

The cycle removes exactly `24` file/context entries and one code-size entry.
Dependency-aware extraction rejected a Node entrypoint whose mutable
initialization guard could not be assigned safely through an imported binding.
TypeScript overload families were kept co-located after the first focused
typecheck exposed their boundary requirement. The final `62` count completes
the `112 -> 62` goalpost, keeps the review at `139` changed paths under the
repository's `140`-path boundary, and makes `12` the next policy target.
