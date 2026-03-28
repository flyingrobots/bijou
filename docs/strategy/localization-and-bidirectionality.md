# Localization and Bidirectionality

_Design note for locale-aware Bijou shells, content, and directional layout_

## Why this exists

Localization in Bijou should not mean:

- translating a few strings later
- assuming English layout forever
- bolting RTL support onto already hardcoded left/right shell behavior

Locale affects:

- copy
- wrapping
- value placement
- date/time/number formatting
- help and hint text
- reading direction
- layout mirroring

This note exists so Bijou can treat localization and bidirectionality as framework concerns early, before more LTR and English assumptions harden.

Follow-on package direction is now captured in:

- [bijou-i18n Should Be a Real Package](./bijou-i18n-packages.md)
- [bijou-i18n Runtime spec](../specs/bijou-i18n-runtime.spec.json)
- [bijou-i18n Tools spec](../specs/bijou-i18n-tools.spec.json)

## Product stance

Bijou should provide:

- localization-friendly APIs
- shell support for localizable message descriptors
- locale-aware formatting seams
- logical layout direction

Bijou should not assume:

- filesystem storage
- a specific translation backend
- a specific persistence mechanism
- English as the default spatial budget

By default, the framework can remain in-memory and adapter-driven.

## Design principles

### 1. Localized text must reflow honestly

A layout should not depend on one English string length.

When localized text grows, Bijou should prefer:

- stacking
- wrapping
- secondary-line fallbacks

over:

- clipping
- collision
- ambiguous truncation

### 2. Use logical direction, not only physical direction

Framework APIs should increasingly think in:

- `start`
- `end`
- `leading`
- `trailing`

instead of only:

- `left`
- `right`

Physical left/right should remain available as explicit escape hatches, but logical direction should become the default mental model.

### 3. Text direction and layout direction are not identical

A locale may be RTL while still containing many LTR fragments:

- file paths
- commands
- IDs
- URLs
- code
- numbers

Bijou should not mirror or reorder these blindly.

### 4. Shell chrome must be localizable

The shell should not hardcode English strings for:

- help labels
- search labels
- settings labels
- notification labels
- quit-confirm copy
- empty states

Those surfaces should be designed to accept localized message descriptors later, even if today they are still powered by in-memory English defaults.

### 5. Bidirectionality should be intentional

Not everything should mirror.

Bijou should define what is:

- logical and mirrored
- physical and fixed
- content and direction-sensitive

## RTL / BiDi posture

### What should generally mirror

- shell drawer default side when it is conceptually “start” or “end”
- side-rail ordering in standard shells
- breadcrumb flow
- disclosure and directional affordances
- pane sequencing where order is semantic rather than physical

### What should generally not blindly mirror

- code
- IDs
- paths
- commands
- URLs
- raw tabular data unless explicitly directional

### Why this matters early

If we hardcode left/right everywhere now, later RTL support becomes invasive across:

- app frame
- split panes
- drawers
- notifications
- help
- settings
- breadcrumbs

That is avoidable if we start naming and thinking logically now.

## Framework direction

Longer term, Bijou should likely carry directional state in context or equivalent render configuration, something like:

- `direction: 'ltr' | 'rtl' | 'auto'`

That would allow shell, components, and later blocks to make consistent decisions without local hacks.

## Localization tooling direction

Future framework/tooling support should consider:

- message-descriptor APIs
- locale-aware formatting helpers
- pseudo-localization mode
- long-string stress testing
- layout overflow warnings for localized shells
- audits for hardcoded user-facing strings in shell/component layers
- dedicated runtime and tooling package boundaries for localization work

## DOGFOOD implication

DOGFOOD should eventually prove:

- localized shell chrome
- direction-aware shell layout
- profile/help/search/settings copy that remains legible under localization pressure

Full RTL DOGFOOD does not need to be the first implementation target, but DOGFOOD should not keep teaching LTR-only assumptions forever.

## Relationship to other doctrine

This note should be read alongside:

- [Bijou UX Doctrine](./bijou-ux-doctrine.md)
- [Accessibility and Assistive Modes](./accessibility-and-assistive-modes.md)
- [Content Guide](./content-guide.md)

## Acceptance bar

This direction is working when:

- Bijou stops introducing new unnecessary physical left/right assumptions
- shell/content copy is treated as localizable framework surface
- long localized strings have honest layout behavior
- RTL is designed as a first-class future capability instead of a retrofit fantasy
