---
title: DL-037 DOGFOOD Touched-File Localization Scope
lane: engineering-policy
priority: medium
github_issue: 664
status: accepted
keywords:
  - dogfood
  - localization
  - i18n-debt
  - ratchet
  - code-standards
---

# DOGFOOD Touched-File Localization Scope

## Linked Work

- Decision task: [#664](https://github.com/flyingrobots/bijou/issues/664)
- Case that prompted it: [#586](https://github.com/flyingrobots/bijou/issues/586)
  (3-hour family entry) inherited
  [#655](https://github.com/flyingrobots/bijou/issues/655) (5-hour story
  localization) because `examples/docs/stories-story-guided-flow.ts` carries 36
  raw-string debt entries.
- Rule owner: `AGENTS.md`, CODE_STANDARDS section.
- Mechanism: `examples/docs/i18n-debt-touched.ts`, run by
  `npm run dogfood:i18n:debt` (`scripts/dogfood-i18n-debt.ts`) in pre-push.

## Sponsors

- **Human:** James Ross, maintainer. Delegated the decision.
- **Agent:** Claude. Measured the debt and the backlog, wrote this record and
  the scanner change.

## Decision Summary

The rule becomes **hybrid**. It binds the change, with a minimum reduction for
each touched file:

1. **Change-scoped.** A touched DOGFOOD source may not add a raw visible-copy
   string that its base did not already carry. Modified copy counts as added,
   so the change must localize every string it writes.
2. **Per-touch floor.** A touched file that still has debt must end with fewer
   raw-string entries than its base: at least one fewer. The scanner has
   enforced this since the touched-file rule was added.
3. **Whole-file cleanup is not required.** Localizing the whole file is still
   welcome, but a small edit does not take on the whole file's debt.

The aggregate baseline (`DOGFOOD_I18N_DEBT_BASELINE`, total 2,289) and the
per-surface limits are unchanged. No baseline grows and no threshold softens.

## The Finding That Settled It

The scanner and the AGENTS.md text did not say the same thing.
`evaluateDogfoodTouchedI18nDebt` only required `currentCount < baseCount`: one
localized string was enough. The AGENTS.md text said "clean that file". #655 was
sized at 5 hours from that text. The gate itself would have accepted #586 after
localizing one string.

There was also a gap in the other direction. Because the scanner compared only
counts, a change could add three new raw strings and localize four old ones,
and still pass. Under the decision, that change fails.

## Measurements

Taken on `origin/main` at `1b735f27` (2026-11-15) with
`collectDogfoodI18nDebt()`. Part files are combined into their canonical path.

| Measure | Value |
| --- | --- |
| Raw-string debt, total | 2,289 entries in 136 files |
| Files with at least 10 entries | 78 (2,036 entries) |
| Files with at least 20 entries | 59 (1,764 entries) |
| Files with at least 36 entries (the #655 size) | 13 (521 entries) |
| Largest file | `stories-story-select.ts`, 50 entries |

Open backlog: 170 open issues. Five name a DOGFOOD source with debt: #655 (36),
#583 (77, five files), #490 (85, three files), #527 (8) and #299 (4). That is
210 entries a whole-file reading would attach to them. At least 15 more open
tasks change DOGFOOD story or Block files without naming them: #586, the
drawer work (#624, #627, #628, #630, #631, #633), the RTL tasks (#615, #617,
#619, #622, #626) and the glossary passes (#590, #592, #593). The median file
has about 20 entries. A 36-entry file cost an estimated 5 hours, so a typical
whole-file obligation is about 3 hours. At the estimate, about 20 open tasks
would each take on a localization prerequisite larger than many of the tasks.

Burndown so far: the baseline fell from 2,317 (2026-08-21) to 2,289
(2026-10-24). That is 28 entries in about two months under the whole-file
reading. The whole-file obligation did not produce fast burndown. It made
contributors avoid touching DOGFOOD files, or split a task in two, as #586 and
#655 show.

Estimated burndown for each option, at about 20 touches per backlog cycle:

| Option | Minimum fall per touch | Backlog cycle | Can debt grow? |
| --- | --- | --- | --- |
| Whole-file (text as written) | whole file, about 20 | about 400, if the work is not avoided | No |
| Change-scoped only | 0 | 0, falls only through dedicated tasks | Count cannot. A swap of old for new strings can, unless values are checked |
| Hybrid (chosen) | 1, and no new strings | at least 20, plus dedicated tasks | No |

The rule's goal is a ratchet that never goes up. Speed comes from dedicated
localization tasks such as #655, which stay one task for each story.

## Alternatives Rejected

- **Whole-file (current text).** Easy to check, and it reduces debt quickly
  if people do the work. It lost because the measured effect is avoidance:
  28 entries in two months, and a 3-hour task blocked by a 5-hour one. It also
  disagreed with the gate, and a rule that the gate does not enforce teaches
  people to ignore the rule text.
- **Change-scoped only.** Small edits stay small. It lost because the
  aggregate count would fall only through dedicated tasks. A file that is
  touched often would keep its debt forever, and the reviewer's goal of
  steady improvement would be gone.
- **Whole-file above a size threshold** (for example, files with fewer than
  10 entries must be cleaned completely). It lost because it adds a second
  number to argue about and tune. Most files are above 10 entries, so it adds
  little. A threshold that changes later is a softened threshold under
  AGENTS.md.
- **Per-touch floor larger than one** (for example, 5 entries). It lost
  because the cost is not predictable. A family-metadata edit would still
  need translated catalog rows in fr, es and de. A floor of one keeps the
  obligation to minutes and keeps the ratchet strictly decreasing.

## Consequences

- The ratchet stays strictly non-increasing. Every touched file with debt
  falls by at least one entry, no touched file gains a raw string, and the
  aggregate and per-surface baselines hold.
- The scanner now compares raw-string values in each touched file (and each
  split lineage, as a group) against the base. Each value is matched once, so
  a duplicated string counts as added. The check runs only when a base exists.
  A new file still fails on any debt, as before.
- This rule is not permission to leave debt behind. Dedicated localization
  tasks are still the main way to reduce debt. The separate Code Dojo
  goalpost rule (each met goalpost cuts `npm run code-dojo:debt` by at least
  50) is unchanged and additive.
- #586 needs only a one-entry reduction in the guided-flow story, and no new
  raw strings. Its dependency on #655 can be removed. #655 stays as the
  pattern-setting localization task.
- Reversible: policy text plus one function. Any later loosening needs a new
  design record.

## Tests

`scripts/dogfood-i18n-debt-touched-added.test.ts`, written before the change
(implementation in `examples/docs/i18n-debt-touched-added.ts`):

- A touched file that localizes two strings and adds one new raw string fails
  with `adds raw string "..."`, although its net count falls.
- A touched file that localizes one string and adds only non-visible
  identifiers passes. The rest of the file's debt can stay.
- Existing cases in `scripts/dogfood-i18n-debt-touched.test.ts` hold: no reduction fails, a split lineage that only moves
  debt fails, and a clean file passes.
