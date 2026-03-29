# LX-008 — Localize Shell Chrome and DOGFOOD

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Why this cycle exists

LX-001 through LX-006 built the localization substrate:

- runtime catalogs
- tools and exchange workflows
- filesystem helpers
- XLSX adapters

But the humane shell and DOGFOOD still ship mostly hardcoded English copy.

This cycle exists to prove that the i18n work is real in product surfaces:

- shell chrome
- shell overlays and drawers
- DOGFOOD landing and onboarding copy

## Scope of this cycle

This cycle intentionally covers:

- a shell-level i18n seam for `createFramedApp()`
- localized shell-owned defaults such as:
  - command palette title
  - default search title
  - settings drawer title
  - quit confirm copy
  - footer notification cue and shell drawer footer hints
- DOGFOOD-localized copy for:
  - landing footer and prompt
  - search/settings labels
  - empty-state onboarding copy
  - settings row labels, descriptions, and feedback
- one visible direction-aware shell behavior driven by i18n direction metadata

It does **not** include:

- full generic bidirectional layout support across every shell surface
- localizing every example in the repo
- provider/service adapters
- persistence

The point is to prove the localization runtime in the shell and DOGFOOD without pretending RTL support is solved everywhere.

## Human users

### Primary human user

A builder or end user working in a non-English locale.

They need to:

- see shell controls and onboarding copy in their locale
- trust that shell labels, footer hints, and settings copy are not locked to English
- see at least one shell behavior react to logical direction instead of physical left/right assumptions

### Human hill

A non-English user can enter DOGFOOD and immediately see localized shell/UI copy, while a builder can point to DOGFOOD as proof that Bijou localization is not theoretical.

## Agent users

### Primary agent user

An agent integrating or validating localized Bijou surfaces.

It needs to:

- load catalogs into the shell and docs proving surface
- verify localized strings at the rendered shell boundary
- reason about direction-aware shell behavior through explicit runtime metadata

### Agent hill

An agent can localize shell chrome and DOGFOOD through explicit i18n contracts instead of editing hardcoded English strings in place.

## Human playback

1. A builder creates a localized runtime.
2. They launch DOGFOOD in that locale.
3. The landing footer and prompt use localized copy.
4. After entering the docs, the shell drawer titles, search surface, footer hints, and settings copy use localized copy too.
5. In an RTL locale, at least one shell drawer placement mirrors logically instead of staying physically fixed.

## Agent playback

1. An agent loads shell and DOGFOOD catalogs into an i18n runtime.
2. It passes that runtime into the shell/docs app.
3. It verifies localized shell strings in rendered frames.
4. It verifies pseudo-localized copy appears in DOGFOOD.
5. It verifies direction metadata changes a visible shell behavior.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)
- [Focus Owns Input](/Users/james/git/bijou/docs/invariants/focus-owns-input.md)
- [Shell Owns Shell Concerns](/Users/james/git/bijou/docs/invariants/shell-owns-shell-concerns.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)

## Invariants for this cycle

- `createFramedApp()` must own shell-localized defaults instead of pushing shell copy responsibility entirely to apps
- DOGFOOD should prove canonical shell localization instead of inventing a separate one-off mechanism
- the direction signal must cause at least one visible shell change
- shell localization must degrade safely when an i18n runtime is absent

## Deliverable

Introduce:

- a shell i18n seam in `bijou-tui`
- a canonical shell catalog for frame-owned copy
- DOGFOOD-localized catalogs and runtime wiring

So that shell chrome and DOGFOOD can run against locale/direction metadata instead of hardcoded English strings.

## Proposed API direction

The first slice should be close to:

```ts
interface CreateFramedAppOptions<PageModel, Msg> {
  readonly i18n?: I18nRuntime;
}
```

With:

- a built-in frame-shell catalog exported from `bijou-tui`
- DOGFOOD creating and using an i18n runtime, loading both shell and docs catalogs

Exact names can still move, but the responsibilities should not.

## Tests to write first

### Cycle-owned playback tests

Under `tests/cycles/LX-008/`:

- a localized framed app shows translated shell-owned titles and hints
- DOGFOOD renders pseudo-localized shell/docs copy when supplied localized catalogs
- an RTL runtime changes a visible shell behavior such as drawer anchor placement

### Package-local tests

In existing package/example test surfaces:

- shell quit/search/settings defaults use localized copy when an i18n runtime is provided
- DOGFOOD settings/landing/onboarding copy comes from catalogs rather than hardcoded strings

## Risks

- only partially localizing shell surfaces and leaving confusing English islands
- adding an i18n seam that DOGFOOD does not actually prove
- claiming direction-awareness without any visible shell behavior change
- threading translator functions everywhere instead of defining one shell-localized seam

## Out of scope

- full generic RTL layout mirroring across every component
- persistence
- service-backed localization workflows
- every example app in the repo

## Retrospective

### What landed

- a canonical shell i18n module in `bijou-tui`:
  - `packages/bijou-tui/src/app-frame-i18n.ts`
- a `createFramedApp({ i18n })` seam for shell-owned copy and direction metadata
- localized shell defaults for:
  - command palette title
  - default search title
  - settings title and footer hint
  - notification-center title, footer hint, and footer cue label
  - help title and hint
  - quit-confirm title, body, and footer hint
  - shell mode labels
- DOGFOOD-localized catalogs and runtime wiring for:
  - landing prompt and footer
  - onboarding / empty-state copy
  - localized search/settings surfaces
  - settings-row labels, descriptions, value labels, and feedback toasts
- visible direction-aware shell behavior:
  - settings drawer resolves to logical `start`
  - notification center resolves to logical `end`
  - the settings drawer visibly mirrors under RTL
- cycle-owned playback coverage in:
  - `tests/cycles/LX-008/localized-shell-and-dogfood.test.ts`

### Drift from ideal

This cycle proved the shell/runtime seam cleanly, but it did not finish every English island.

Still intentionally incomplete:

- help-overlay keybinding descriptions still mostly fall back to English strings
- notification history/body copy is only partially localized
- direction awareness is real but still narrow; only a subset of shell drawer placement is mirrored so far

That drift is acceptable for LX-008 because the point of the cycle was to prove that shell localization and direction metadata are real in product surfaces, not to declare shell localization complete.

### Debt spawned

Spawned:

- [LX-009 — Localize Shell Help, Notification, and Directional Surfaces](/Users/james/git/bijou/docs/BACKLOG/LX-009-localize-shell-help-notification-and-directional-surfaces.md)
