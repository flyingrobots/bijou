---
id: LX-020
title: DOGFOOD Locale Demo Readiness
status: active
lane: asap
priority: high
github_issue: 340
legend: LX
---

# LX-020 - DOGFOOD Locale Demo Readiness

Legend: [LX - Localization and Bidirectionality](../legends/LX-localization-and-bidirectionality.md)

## Decision Summary

DOGFOOD should stop presenting non-English locale selection as if the whole app
is fully translated. For `v7.2.0`, the honest release-demo contract is:

- core app chrome and release-demo navigation do not show missing localization
  placeholders
- English-source documentation is labeled as such when selected locale content
  is intentionally unavailable
- localization debt remains visible to maintainers without leaking broken UI
  into the user-facing demo path

## Sponsored Human

A release-video user needs DOGFOOD to survive a non-English locale switch
without looking broken. Missing localization markers, accidental English chrome,
and unclear partial-translation behavior make the shipped story feel unfinished.

## Sponsored Agent

An agent needs deterministic localization witnesses that distinguish three
states:

- selected-locale translation exists and is rendered
- selected-locale translation is intentionally unavailable and the app presents
  an English-source notice
- selected-locale translation is missing by accident and should fail the gate

## Hill

After this cycle, DOGFOOD's non-English demo path is truthful enough for a
release video: switching locales does not expose missing-placeholder strings in
major app chrome, and documentation surfaces clearly explain when they remain
English-source content.

## Problem

Issue #340 came from the `v7.1.0` release-video rehearsal. DOGFOOD can switch to
non-English locales, but much of the app still renders English copy or missing
localization markers. Existing i18n gates prove debt is counted, not that the
presentation path is demo-ready.

The current debt ratchet is useful, but it is not sufficient for user-facing
release claims:

```text
dogfood-i18n-debt: ok (2772 raw strings; baseline 2772; 78 missing Markdown localizations; baseline 78)
```

That output tells maintainers the known debt did not grow. It does not tell a
viewer why non-English DOGFOOD still shows English documentation.

## Scope

- Audit the launch, navigation, settings, status/footer, and major tab chrome
  for the supported non-English DOGFOOD locales.
- Add deterministic coverage that fails when the release-demo path renders
  visible missing-localization placeholders.
- Add or update DOGFOOD copy so intentionally English-source documentation is
  labeled clearly when the selected locale lacks translated Markdown.
- Keep the existing debt ratchet intact; this cycle strengthens the
  presentation contract around it.
- Update release-facing docs/changelog so `v7.2.0` describes the localization
  posture honestly.

## Non-Goals

- Do not translate the full DOGFOOD documentation corpus in this cycle.
- Do not build a localization workbench or dashboard.
- Do not change the CSV/XLSX localization workflow.
- Do not hide known debt from maintainer tooling.
- Do not broaden `v7.2.0` into the V8/V9 localization operations surface.

## User Experience Contract

For non-English locales, DOGFOOD may show English documentation only if the UI
makes that fallback explicit. The user should not have to infer whether English
copy is a bug, an untranslated source document, or a missing catalog entry.

Major app chrome should be localized or explicitly excluded from the release
demo path. Missing-placeholder strings are not acceptable on the demo path.

## Lower Modes

### Static Mode

Static DOGFOOD render helpers should be able to render a selected-locale path
and expose whether missing placeholders appear in visible output.

### Pipe Mode

Pipe/smoke output should remain deterministic and suitable for release evidence.
Locale-specific output checks must avoid terminal-profile assumptions.

### Accessible Mode

English-source notices should be text, not color-only styling. Screen readers
and terminal readers should receive the same partial-localization status.

## Localization / Directionality Posture

This cycle treats localization status as product truth. The app may still carry
known translation debt, but the release-demo path must make that debt explicit
instead of looking accidentally broken.

No new right-to-left layout contract is introduced. Direction metadata should
continue to flow from the selected locale through the existing localization
port/runtime path.

## Agent Inspectability / Explainability Posture

Agents should be able to inspect:

- which locale was selected
- whether a rendered string came from selected-locale content, fallback content,
  or an English-source documentation notice
- whether missing localization markers appeared in the tested output

The proof should be executable through focused tests and existing DOGFOOD i18n
commands, not through screenshots alone.

## Linked Invariants

- DOGFOOD visible release claims must be true in the app.
- Known localization debt must stay counted by the ratchet.
- Missing localization placeholders must not appear in the release-demo path.
- English-source documentation fallback must be explicit to users.

## Implementation Plan

1. Add focused failing tests that render representative non-English DOGFOOD
   paths and assert no visible missing-localization placeholders are present.
2. Identify the release-demo chrome surfaces that should be localized now.
3. Add an English-source documentation notice for intentionally untranslated
   Markdown/documentation surfaces.
4. Update catalog entries or DOGFOOD copy for the scoped chrome surfaces.
5. Preserve the existing `dogfood:i18n:debt`, `dogfood:i18n:check`, and
   `dogfood:i18n:complete` gates.
6. Update changelog and any release-facing wording needed to avoid overclaiming
   full DOGFOOD translation.

## Tests To Write First

- A non-English DOGFOOD launch/render path fails if visible missing
  localization markers appear.
- A selected non-English documentation path renders an explicit English-source
  notice when translated Markdown is unavailable.
- Locale switching keeps major app chrome free of accidental missing markers.
- Existing debt-ratchet behavior still reports known raw-string and Markdown
  localization debt.

## Acceptance Criteria

- Non-English release-demo path has deterministic missing-placeholder coverage.
- Major DOGFOOD chrome on that path is localized or explicitly excluded from the
  release-demo claim.
- English-source documentation fallback is visible and textual.
- Existing i18n debt gates remain green.
- `docs/CHANGELOG.md` records the demo-readiness fix.
- Issue #340 is closed by the implementation PR.

## Retrospective

To be completed when the PR lands.
