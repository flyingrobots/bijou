---
title: DL-039 Machine-Drafted Translations Are Current Catalog Values
lane: localization
priority: medium
github_issue: 960
status: decided
keywords:
  - localization
  - dogfood
  - translation
  - catalogs
---

# Machine-Drafted Translations Are Current Catalog Values

## Linked Work

- Decision issue: flyingrobots/bijou#960 (container flyingrobots/bijou#738)
- Applied by: flyingrobots/bijou#965
  (DOGFOOD title screen in zh-Hans, ja and ko), flyingrobots/bijou#966
  (Components app in zh-Hans, ja and ko)
- Precedent: [DL-035](./DL-035-translation-glossary.md), the French, Spanish
  and German translations

## Sponsors

- **Human:** James Ross — decided on 2026-11-28: "it works just like we've
  been doing French, Spanish etc."
- **Agent:** Claude — recorded the decision.

## Decision Summary

A machine-drafted translation, whether from an agent or a local LLM, enters the
catalog exactly as the French, Spanish and German translations did. Its status
is `current`. The exchange sheet keeps its three statuses (`current`, `stale`,
`missing`), and no `draft` status is added.

Whether a locale has had a native-speaker review is recorded once, for the
whole locale, in its decision or glossary record, as DL-035 does ("a
native-speaker review remains outstanding"). Each locale's native-speaker
review task (for example flyingrobots/bijou#688) closes that note.

## Consequences

- DOGFOOD shows a drafted value as it shows any other value. Drafts do not fall
  back to English.
- `stale` keeps its single meaning: the English source changed after the
  translation.
- Nothing in a catalog tells a drafted value from a reviewed one. The per-locale
  record and the review task carry that.

## Options Considered

- **A `draft` status that the runtime treats as `current`.** Rejected: it
  changes the published exchange-sheet schema in `bijou-i18n-tools`, and the
  existing French, Spanish and German values would need a status they were never
  given.
- **Writing drafts as `stale`.** Rejected: `stale` means the source changed.
- **A note in each row's `description`.** Rejected: descriptions are the
  translator's context for the source string, not review state.
