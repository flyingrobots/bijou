# DF-021 — Shape DOGFOOD As Terminal Docs System

Legend: [DF — DOGFOOD Field Guide](../legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-019 — Raise DOGFOOD Coverage Floor to 100%](./DF-019-raise-dogfood-coverage-floor-to-100-percent.md)
- [WF-004 — Shape The Next Release](./WF-004-shape-the-next-release.md)

## Sponsor human

A builder or maintainer who expects DOGFOOD to behave like Bijou's
terminal-native documentation site, not only a component-story browser.

## Sponsor agent

An agent that must answer, from repo artifacts alone:

- what DOGFOOD is supposed to document
- which parts of the repo must be reachable inside DOGFOOD before
  `4.1.0` ships
- which missing docs surfaces are now release blockers

## Hill

DOGFOOD is shaped as a terminal documentation system for Bijou, with the
current component-library explorer treated as one important section
inside a broader docs site rather than the whole product.

## Why this cycle exists

DOGFOOD has crossed an important threshold:

- all `35/35` canonical component families are now represented
- the shell and landing surfaces are strong enough to feel like a real
  product
- the docs app is already the proving surface for Bijou's shell,
  design-language, and component work

But the scope is still too narrow for what the repo now claims DOGFOOD
to be.

Today, DOGFOOD is still mostly a **components docs view**:

- it has a landing screen
- it has a component-family explorer
- it can show component story docs and variants
- it does **not** yet act like a terminal-native documentation site for
  the repo as a whole

That gap is now release-shaping:

- there is no real viewer for prose docs from `docs/`
- there is no DOGFOOD section for repo/package documentation
- there is no DOGFOOD section for Bijou's philosophy, architecture, and
  doctrine docs
- the current shell structure still assumes "components" is the whole
  docs product

If `4.1.0` ships while DOGFOOD remains component-only, Bijou will still
have a strong component field guide, but it will not yet have the
terminal docs surface that the repo increasingly implies exists.

## Human users

### Primary human user

A builder evaluating Bijou as a framework, not just as a pile of
widgets.

### Human hill

A user can open DOGFOOD and browse:

- what Bijou is
- how it is organized
- what each package is for
- how the component library works
- what philosophical and architectural ideas shape the repo

without leaving the terminal to read the main docs corpus.

## Agent users

### Primary agent user

An agent tasked with extending DOGFOOD, importing docs, or explaining
Bijou's public surface to users.

### Agent hill

An agent can recover the expected DOGFOOD information architecture from
repo docs and can see exactly which missing docs surfaces block `4.1.0`.

## Playback questions

1. If a user asks "where do I read real Bijou docs in the terminal?",
   does DOGFOOD have a clear answer beyond component stories?
2. Can a user browse both the component library and the non-component
   docs corpus without the app pretending they are the same thing?
3. Can a user find package-level explanations for `@flyingrobots/bijou`,
   `@flyingrobots/bijou-tui`, the i18n packages, and the app template?
4. Can a user read Bijou's philosophy, architecture, and doctrine docs
   from inside DOGFOOD?
5. Can an agent point to explicit `4.1.0` blocker items for those gaps?

## Accessibility / assistive reading posture

This cycle is prose-heavy. The docs shell must preserve legible reading
in plain text, keyboard navigation, and scrollable surfaces that do not
depend on screenshots, pointer-only interaction, or color alone to
communicate structure.

## Localization / directionality posture

The docs shell should stay localization-ready, but this cycle does not
block `4.1.0` on translating the entire imported prose corpus. The
important requirement is that section metadata and reader structure do
not hard-code LTR-only assumptions.

## Agent inspectability / explainability posture

The DOGFOOD docs-site shape must be explicit in repo artifacts:

- this cycle doc
- release blocker backlog files in `docs/BACKLOG/v4.1.0/`
- signposts such as `PLAN.md`, `BEARING.md`, and `release.md`

Agents should not have to infer from chat memory that DOGFOOD is
supposed to grow beyond the component explorer.

## Non-goals

- importing every markdown file in the repo into DOGFOOD for `4.1.0`
- full website parity with static docs tools
- full-text search across every prose page
- a general GSAP-like text-effects API for the entire framework
- eliminating every piece of bespoke DOGFOOD chrome before `4.1.0`

The immediate requirement is a real docs-site shape and a non-embarrassing
minimum corpus, not infinite scope growth.

## Evidence

### Current DOGFOOD shape

- DOGFOOD already has a strong landing screen and framed docs shell
- the current explorer is fundamentally centered on component families,
  component docs, and variants
- the existing app still treats that component explorer as the main docs
  product

### Current repo docs shape

Bijou's actual docs corpus already exists outside DOGFOOD:

- `docs/ARCHITECTURE.md`
- `docs/system-style-javascript.md`
- `docs/METHOD.md`
- `docs/VISION.md`
- `docs/release.md`
- `docs/releases/4.1.0/`
- package READMEs and repo-facing top-level docs

So the missing work is not "write every thought from scratch." The
missing work is exposing the right corpus and navigation structure
inside DOGFOOD itself.

## Decision

### DOGFOOD's `4.1.0` role

For `4.1.0`, DOGFOOD should be treated as a **terminal documentation
site for Bijou**, not only a component gallery.

### Expected top-level sections

At minimum, DOGFOOD should visibly distinguish these sections:

- **Start Here / Guides**
  - what Bijou is
  - how to get oriented
  - how to start building
- **Components**
  - the current family/story/variant explorer
- **Packages**
  - what each shipped package is for
  - when to reach for each one
- **Philosophy / Architecture**
  - design doctrine, architecture, and repo philosophy
- **Release / Migration**
  - what changed in the current line
  - how to move between major versions

The current components view remains important, but it becomes one
section of the docs system instead of the whole app.

### `4.1.0` blocker stance

These gaps are now **release blockers** for `4.1.0`:

- no prose-doc reader plus top-level docs navigation
- no repo/package docs inside DOGFOOD
- no philosophy/architecture/doctrine docs inside DOGFOOD

If those remain absent, the release would still ship a strong component
field guide, but not the terminal docs system Bijou increasingly claims
to have.

## Deliverables from this shaping cycle

This cycle should spawn three explicit `4.1.0` blockers:

- [DF-022 — Build Prose Docs Reader And Top-Level DOGFOOD Nav](./DF-022-build-prose-docs-reader-and-top-level-dogfood-nav.md)
- [DF-023 — Publish Repo, Package, And Release Guides In DOGFOOD](../BACKLOG/v4.1.0/DF-023-publish-repo-package-and-release-guides-in-dogfood.md)
- [DF-024 — Publish Philosophy, Architecture, And Doctrine Guides In DOGFOOD](../BACKLOG/v4.1.0/DF-024-publish-philosophy-architecture-and-doctrine-guides-in-dogfood.md)

## Implementation outline

1. Shape a top-level DOGFOOD docs-site IA instead of treating
   "components" as the only section.
2. Add a prose-doc reader path so markdown- and guide-like pages can be
   read inside the app.
3. Expose a minimum set of repo/package/release pages in that reader.
4. Expose a minimum set of philosophy/architecture/doctrine pages in
   that reader.
5. Keep component stories as the "Components" section rather than
   letting them keep masquerading as the whole docs product.

## Tests to write first

Under `tests/cycles/DF-021/`:

- the cycle doc exists and names the missing docs-site sections
- a `docs/BACKLOG/v4.1.0/` lane exists
- the three blocker items exist in that lane
- `PLAN.md`, `BEARING.md`, and `release.md` acknowledge reopened
  `4.1.0` blockers around DOGFOOD scope

## Risks

- treating DOGFOOD's component explorer as "good enough docs" and
  shipping a narrower product than the repo's own story implies
- reopening the `4.1.0` boundary without making the new blockers
  explicit in METHOD signposts
- trying to solve search, docs import, architecture writing, and motion
  APIs all at once instead of defining a credible minimum docs-site
  contract

## Retrospective

### What landed

- DOGFOOD's next shape is now explicit: terminal docs system, not only
  component gallery
- the missing `4.1.0` docs-site surfaces are named as concrete blockers
- the release boundary is narrowed around a more honest docs promise

### Debt spawned

Follow-on work such as generalized text-motion APIs, richer search, and
deeper bespoke-chrome cleanup may still matter, but they should not hide
the more important docs-site gaps that now block `4.1.0`.
