---
title: DF-049 Audit multi-field and staged forms family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - forms
---

# DF-049 Audit multi-field and staged forms family across real surfaces

## Framing

`group()` and `wizard()` are the smallest form blocks that prove Bijou can
model related user input as one coherent task. A group keeps related fields in
one focused packet. A wizard keeps step boundaries and progress explicit when
the task should unfold over time.

This audit verifies the existing `group-wizard` DOGFOOD story against real
story rendering, component-family doctrine, and mode-aware lowerings. It does
not redesign the form runtime; it turns current story truth into executable
release proof.

## Sponsored Users

- TUI app authors composing setup, deploy, checkout, sign-up, and settings
  flows from first-party blocks.
- Docs readers checking how grouped and staged forms behave when borders,
  color, and interactive focus are unavailable.
- Maintainers who need a focused regression tying form-block story metadata,
  variants, and component-family guidance to real output.

## Hills

1. A builder can inspect the DOGFOOD forms story and understand when to use a
   single grouped form versus a staged wizard.
2. A reader can switch both variants through interactive, static, pipe, and
   accessible profiles while preserving labels, values, summaries, and step
   state.
3. A maintainer can run one cycle test that proves form-block story metadata
   and design-system guidance have not drifted away from runtime behavior.

## Playback Questions

- Does DOGFOOD expose the family through the `group-wizard` story?
- Do variants cover both single-step grouped fields and staged wizard progress?
- Do rich/static previews preserve visual containment and field rhythm?
- Do pipe lowerings preserve sequential prompts, labels, values, summaries,
  and step intent?
- Do accessible lowerings linearize labels and wizard progress without relying
  on borders, color, or visual grouping?
- Do component-family docs still position `group()` and `wizard()` as related
  data-collection blocks rather than generic layout containers?

## Requirements

- Keep the existing `group-wizard` story identity and
  `multi-field-and-staged-forms` coverage family id.
- Render every grouped/staged form story variant in every canonical story
  profile.
- Treat box drawing as visual-profile chrome only.
- Keep pipe and accessible lowerings field-label-first and
  semantic-preserving.
- Confirm `docs/design-system/component-families.md` still matches the runtime
  story posture.

## Acceptance Criteria

- `tests/cycles/DF-049/forms-family-audit.test.ts` proves the cycle doc
  carries the modern playback sections.
- The test locates the DOGFOOD `group() / wizard()` story and verifies
  expected variants.
- Every variant renders non-empty output in every documented profile.
- Rich/static output includes visual containment; pipe and accessible output
  do not depend on box drawing.
- Pipe and accessible output preserve form titles, labels, values, summaries,
  and wizard step state.
- Component-family docs retain grouped form, staged flow, progress, summary,
  and accessibility guidance.

## Implementation Outline

1. Add a DF-049 cycle test that renders the `group-wizard` DOGFOOD story
   through the shared story protocol.
2. Read-test the multi-field and staged forms section in
   `docs/design-system/component-families.md`.
3. Move the backlog note into `docs/design/` and update the v6 lane pointer.
4. Record any drift as follow-on backlog debt instead of widening this audit.

## Drift Check

No runtime drift was found in this slice. The existing `group-wizard` story
already distinguishes grouped forms from staged flows, renders boxed field
rhythm in interactive/static profiles, lowers to sequential labeled prompts in
pipe mode, and linearizes step state in accessible mode.

No follow-on backlog item is needed for this slice.

## Playback

- RED: the release lane had only a backlog note; no DF-049 playback test tied
  grouped and staged forms to real mode lowerings.
- GREEN: the new cycle test renders both `deploy-group` and
  `rollout-wizard` variants across interactive, static, pipe, and accessible
  profiles.
- Rich/static previews preserve visual containment and field rhythm.
- Pipe previews preserve labels, values, summaries, and wizard step intent
  without box drawing.
- Accessible previews linearize the same facts with explicit current-step
  language for the wizard variant.

## Retrospective

The forms story did not need runtime changes. The useful release work was
codifying the first-blocks contract: grouped and staged forms are semantic
data-collection compositions, not string dumps or decorative boxes.
