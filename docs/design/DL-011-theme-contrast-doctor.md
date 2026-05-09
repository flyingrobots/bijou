---
title: DL-011 Theme Contrast Doctor
legend: DL
lane: design
---

# DL-011 Theme Contrast Doctor

## Framing

Bijou has explicit token doctrine, but no first-party tool that verifies whether
a theme follows it. Poor contrast, invalid colors, and suspicious token reuse
can survive until manual visual review.

DL-011 adds a pure theme doctor in core. It checks concrete `Theme` objects and
returns a deterministic report that apps, docs, tests, and future CLI adapters
can render however they want.

## Sponsored Users

- Framework maintainers reviewing built-in and custom theme changes.
- Third-party theme authors who need actionable feedback without opening a TUI.
- Agent workflows that need stable reports for contrast and token hygiene.

## Hills

1. A theme author can run a pure doctor against a `Theme` and get structured
   issues for invalid colors, low contrast, and overused color values.
2. A maintainer can pass explicit foreground/background token pairs and minimum
   ratios to enforce house rules.
3. A test can assert the doctor report without depending on terminal rendering.

## Playback Questions

- Does the doctor flag invalid foreground or background hex strings?
- Does the doctor calculate WCAG-style contrast ratios for token pairs?
- Does the doctor flag weak explicit foreground/background token pairs?
- Does the doctor detect suspicious color reuse when a reuse limit is supplied?
- Does the report carry stable issue kinds, severities, paths, ratios, and
  messages?
- Is the doctor exported from the core theme barrel and root package barrel?

## Requirements

- Add `doctorTheme(theme, options?)`.
- Add `themeContrastRatio(foreground, background)`.
- Support explicit contrast pairs with per-pair minimum ratios.
- Support a maximum color reuse threshold.
- Return structured reports; do not throw for theme quality issues.

## Acceptance Criteria

- Focused RED tests fail before implementation and pass after.
- Invalid colors are reported as errors.
- Low contrast and color reuse are reported as warnings.
- Contrast ratios are deterministic and rounded for reporting.
- Docs and changelog describe the doctor.

## Implementation Outline

- Implement the doctor in `packages/bijou/src/core/theme/doctor.ts`.
- Export it from `packages/bijou/src/core/theme/index.ts` and
  `packages/bijou/src/index.ts`.
- Keep the first slice pure and adapter-free. CLI rendering can build on the
  structured report later.

## Drift Check

- Scope stayed pure and adapter-free. The doctor returns structured reports;
  CLI/TUI rendering can build on that later.
- Missing token families are only reported for explicit `contrastPairs`. The
  concrete `Theme` type already makes built-in families present at compile time.
- Mode-lowering risks remain follow-on work. The first slice focuses on color
  validity, contrast, and suspicious reuse.

## Playback

- `doctorTheme()` reports invalid foreground and background token colors as
  errors.
- Explicit foreground/background token pairs are checked with WCAG-style
  contrast ratios and per-pair minimums.
- `maxColorReuse` reports suspicious repeated color values as warnings.
- Reports include stable issue kinds, severities, paths, colors, ratios,
  limits, counts, and messages.
- The doctor and contrast helper are exported from the core theme barrel and
  root package barrel.

## Retrospective

- Keeping the doctor in `@flyingrobots/bijou` rather than `bijou-tui` was the
  right ownership call. Themes are core objects and should be diagnosable
  without a runtime shell.
- The first pass intentionally does not prescribe a universal contrast policy.
  Explicit pairs let teams encode house rules without making every decorative
  border token follow text contrast thresholds.
