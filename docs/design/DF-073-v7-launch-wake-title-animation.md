---
title: DF-073 V7 Launch Wake Title Animation
legend: DF
lane: release
priority: high
issue: https://github.com/flyingrobots/bijou/issues/303
keywords:
  - dogfood
  - landing
  - release
  - title-screen
  - v7
---

# DF-073 V7 Launch Wake Title Animation

## Framing

Issue #303 asks the current DOGFOOD landing screen to carry the `V7 Launch
Wake` release identity as a living title treatment instead of only exposing the
release title inside the Release guide.

The design follows a Design Thinking loop: observe that `v7.0.0` now has a
published post-release title artifact, frame the landing screen as the first
visible proof surface, prototype a deterministic wake layer on the existing
renderer, and prove it through rendered-frame tests instead of prose-only
assertions.

## Sponsor Human

- A maintainer opening DOGFOOD after `v7.0.0` wants the first screen to feel
  release-specific without becoming a blocking splash page.
- A reader should still see the normal DOGFOOD entry point, prompt, footer
  controls, and release documentation route.

## Sponsor Agent

- A review agent needs the release title, wake motif, pulse behavior, and lower
  modes to remain inspectable through existing artifacts and tests.

## Hill

A DOGFOOD reader can open the landing title screen and see `V7 Launch Wake`
named in the entry panel while a deterministic wake ribbon moves through the
background on pulse. The screen still lowers through the existing release-title
facts and remains bounded by the current landing quality profiles.

## Current Truth

- `V7 Launch Wake` is already the current release-title artifact.
- The landing renderer is already pulse-driven, cached, and quality-bucketed.
- The existing landing screen already renders DOGFOOD, the BIJOU mark, the
  prompt, footer controls, theme controls, quality controls, and FPS/quality
  readout.
- Static, pipe, and accessible release-title output already comes from
  `examples/docs/release-title.ts`.

## Product Shape

### Wide Landing Screen

```text
+------------------------------------------------------------------------------+
|                           BIJOU                                              |
|                                                                              |
|         ~~~~----....    ~~~~----....    ~~~~----....                         |
|       ~~~~----....    ~~~~----....    ~~~~----....                           |
|     ~~~~----....    ~~~~----....    ~~~~----....                             |
|                                                                              |
|  + DOGFOOD / V7 Launch Wake ----------------------------------------------+ |
|  | Documentation Of Good Foundational Onboarding and Discovery             | |
|  +-------------------------------------------------------------------------+ |
|                                                                              |
|                              Press [Enter]                                  |
| Esc/q quit ...                                      60 fps - auto/full v7.0.0 |
+------------------------------------------------------------------------------+
```

### Motion

The wake is not a separate animation subsystem. It is a small bounded paint pass
inside the current landing renderer:

```text
pulse dt
  -> landingTimeMs
  -> quality frame-step quantization
  -> paint background
  -> paint V7 wake ribbon
  -> paint logo, DOGFOOD panel, prompt, footer
  -> cache final frame
```

Foreground content wins. The wake can pass behind logo and panel regions, but
it must never obscure the entry prompt, footer controls, FPS badge, or visible
DOGFOOD panel copy.

## Lower Modes

No new lower-mode contract is needed for this slice.

- Interactive mode gets the animated wake ribbon and localized release title.
- Static mode continues to expose the release title through
  `renderDogfoodReleaseTitleText(..., mode: "static")`.
- Pipe mode continues to expose `release_id`, `release_title`,
  `release_motif`, proof lanes, and navigation facts.
- Accessible mode continues to explain the release title and visual motif in
  prose.

## Localization

This slice must not add new localization keys. The landing panel uses the
existing localized `CURRENT_DOGFOOD_RELEASE_TITLE.titleKey` and the existing
localized DOGFOOD expansion string. The wake ribbon is terminal art, not text.

## Accessibility / Assistive Posture

The wake is decorative in interactive mode. Assistive output must rely on the
existing release-title facts and accessible prose, not on parsing wake glyphs.

## Agent Inspectability / Explainability Posture

Agents should be able to prove the slice by checking:

- the current release title appears on the landing frame;
- wake rows are visible in interactive output;
- wake rows change after pulse;
- pipe/accessibility release facts remain sourced from release-title metadata.

## Tests To Write First

- RED: landing frame does not name `V7 Launch Wake`.
- RED: landing frame has no visible wake rows containing the wake pattern.
- GREEN: the landing frame names `V7 Launch Wake` from existing localization
  keys.
- GREEN: the wake rows are visible and change after pulse.

## Validation

Run focused rendered-frame tests first:

```bash
npx vitest run scripts/docs-preview.test.ts -t "renders the landing page with the animated title treatment|renders a pulse-driven V7 launch wake ribbon"
```

Then run the relevant DOGFOOD validation lane:

```bash
npx vitest run scripts/docs-preview.test.ts
npm run typecheck:test
npm run docs:inventory
npm run dogfood:i18n:check
```

## Playback

This slice lands when DOGFOOD has a visible, localized `V7 Launch Wake` landing
identity and a deterministic pulse-driven wake ribbon, without adding new
strings, bypassing the landing cache, or changing lower-mode release facts.
