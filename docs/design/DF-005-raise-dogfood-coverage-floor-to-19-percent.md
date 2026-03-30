# DF-005 — Raise DOGFOOD Coverage Floor to 19%

Legend:

- [DF — DOGFOOD Field Guide](/Users/james/git/bijou/docs/legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-004 — Raise DOGFOOD Coverage Floor to the Next 5-Point Target](/Users/james/git/bijou/docs/design/DF-004-raise-dogfood-coverage-floor-to-next-target.md)

## Why this cycle exists

DF-004 proved the coverage ratchet can move honestly.

The next promised step is now explicit:

- DOGFOOD currently documents 5 of 35 component families
- the enforced floor is 14%
- the next declared target is 19%

This cycle exists to earn that next target with real component stories, not by moving the policy first.

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 5 to 7 families
- documenting progress and loading surfaces with honest static and animated previews
- raising the enforced floor from 14% to 19%
- raising the next declared target from 19% to 24%

It does **not** include:

- broad DOGFOOD navigation redesign
- a full story-runtime state system for every component preview
- pretending the progress/loading families are now exhaustively documented
- changing the canonical component-family denominator

## Human users

### Primary human user

A builder evaluating whether DOGFOOD explains Bijou's loading and progress affordances honestly.

They need:

- a static determinate progress preview they can scan quickly
- a looping animated progress preview that proves the component is alive, not just described
- explicit loading-placeholder guidance instead of only shell-level status chrome

### Human hill

A user can open DOGFOOD and see both static and animated progress examples plus real loading-placeholder guidance, and the documented coverage percentage moves for that real added content.

## Agent users

### Primary agent user

An agent tasked with expanding DOGFOOD coverage while preserving honesty and keeping previews deterministic.

It needs:

- a clear smallest honest route from 14% to 19%
- a preview seam that can animate without inventing a second runtime
- tests that prove both the docs coverage and the animated preview behavior

### Agent hill

An agent can raise DOGFOOD to the 19% floor only by adding real stories for the `Progress indicators` and `Loading placeholders` families and proving that the progress preview actually animates on pulse.

## Human playback

1. A user enters DOGFOOD and opens the progress story.
2. They can see a static determinate progress example and a looping animated example.
3. They can open the loading-placeholder story and see realistic skeleton usage guidance.
4. The docs coverage card reports a higher percentage that corresponds to those real new stories.

## Agent playback

1. An agent opens the DF-005 cycle doc.
2. It can see that the target is 19%, which requires 7 covered families out of 35.
3. It adds real stories for `Progress indicators` and `Loading placeholders`.
4. It threads a minimal preview clock into DOGFOOD so the animated progress preview changes on pulse without inventing general mutable story state.
5. The cycle tests and gate confirm that coverage is now 20%, which safely clears the 19% floor, and the next target is recorded as 24%.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- the progress story must include both a static and a looping animated preview
- the animated preview must be driven by deterministic pulse time, not real wall-clock side effects
- loading placeholders must be documented through a real `skeleton()` story before they count toward coverage
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-005 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 7 of 35 documented families and 20% real coverage
   - coverage of `Progress indicators` and `Loading placeholders`
   - an enforced floor of 19 with a next target of 24
   - a looping progress preview that visibly changes on pulse
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Thread a preview clock into the docs story renderer for deterministic animation.
5. Raise the floor policy and spawn the next ratchet backlog item.

## Tests to write first

Under `tests/cycles/DF-005/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 7 of 35 families and 20%
- the story catalog now covers `Progress indicators` and `Loading placeholders`
- the enforced floor is 19 and the next target is 24
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the static progress variant remains visually stable across a pulse
- the animated progress variant changes across a pulse

## Risks

- adding an animation seam that is broader than this cycle actually needs
- counting a family before the story is useful enough to teach with
- letting the animated preview become a special-case runtime instead of a small deterministic rendering input

## Out of scope

- complete DOGFOOD coverage
- shell help/localization work
- service-backed localization tooling
- a full generalized animation framework for stories

## Retrospective

### What landed

- new `progressBar()` DOGFOOD story with both a static determinate preview and a looping pulse-driven rollout preview
- new `skeleton()` DOGFOOD story covering short-lived loading placeholders
- a minimal preview clock in the docs explorer so stories can animate deterministically on pulse without a separate story runtime
- canonical family coverage increased from `5/35` to `7/35`
- DOGFOOD docs coverage now resolves to `20%`, which safely clears the `19%` floor
- the enforced floor moved from `14%` to `19%`
- the next declared target moved from `19%` to `24%`

### Drift from ideal

No material drift.

The only architectural addition beyond new stories was a tiny preview-time input for story rendering. That stayed appropriately narrow and did not turn into a generalized mutable story-state system.

### Debt spawned

Spawned:

- [DF-006 — Raise DOGFOOD Coverage Floor to 24%](/Users/james/git/bijou/docs/design/DF-006-raise-dogfood-coverage-floor-to-24-percent.md)
