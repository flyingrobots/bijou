---
title: "LX-012 — DOGFOOD i18n Debt Inventory"
legend: LX
lane: asap
---

# LX-012 — DOGFOOD i18n Debt Inventory

LX-011 added the first DOGFOOD locale preference ratchet, but most visible
DOGFOOD copy can still enter the app as raw English strings in pages, previews,
and examples.

Problem:

- DOGFOOD now has a localization seam, but no counted inventory of the remaining
  localizable UI copy.
- New surfaces can add English strings without making the debt visible.
- Reviewers cannot distinguish intentionally literal examples from user-facing
  copy that should move through catalogs.

Desired outcome:

- Add a deterministic DOGFOOD i18n debt inventory grouped by surface area.
- Count localizable UI strings and ratchet the count downward or hold it steady.
- Separate true nonlocalizable identifiers, code examples, and fixture literals
  from visible application copy.
- Make the report useful in code review without relying on rendered screenshots
  or fragile stdout snapshots.

Why ASAP:

- The Settings locale selector made localization visible to users.
- The next DOGFOOD documentation and Blocks work will otherwise keep adding
  English-only copy.
- A counted debt ledger lets catalog expansion happen incrementally without
  pretending the whole app is translated.

Hill:

A maintainer can run one deterministic check and see which DOGFOOD surfaces
still contain localizable English, what changed, and whether the branch
increased or reduced the debt.

Non-goals:

- Do not translate all DOGFOOD copy in this cycle.
- Do not block markdown source documentation that is intentionally prose.
- Do not infer localization coverage by scraping terminal render output.
