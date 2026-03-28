# Preference Lists Belong to Bijou

_Design note for promoting shell settings presentation into canonical Bijou componentry_

## Why this exists

The shell settings drawer now looks materially better than it did at first:

- focused rows feel selected instead of merely pointed at
- descriptions make preferences legible
- narrow drawers can still explain what a row does
- choice and toggle rows read differently

That quality is good, but too much of it still lives inside shell-specific rendering code.

That is the wrong long-term direction for `DOGFOOD`.

If `DOGFOOD` is serious about "the docs are the demo," then the docs shell should strive to use canonical Bijou componentry wherever possible. The title screen can remain a custom proving surface. The settings drawer should not.

The shell should own:

- placement
- drawer chrome
- input routing
- open / close behavior
- footer/help discoverability

But the rows themselves should be a standard Bijou visual language, not a pile of bespoke shell drawing rules.

## Design-thinking frame

### Primary user

The primary user is the **workspace operator**:

- someone navigating settings in a real framed app
- someone who expects toggles, choices, and descriptions to read clearly
- someone who should not have to mentally decode custom row layouts every time a shell drawer opens

They are asking:

- "What kind of setting is this?"
- "What is currently selected?"
- "What happens if I activate this row?"
- "Why does this row look selected?"

### Secondary user

The secondary user is the **framework builder**:

- someone building on `createFramedApp()`
- someone who wants polished settings UI without copying DOGFOOD-only row presentation code
- someone who wants one canonical vocabulary for settings, preferences, onboarding lists, and maybe later notification review or inspectors

They are asking:

- "Can I get this settings-row quality without hand-drawing it myself?"
- "Can the shell depend on stable preference-list components rather than shell-local rendering?"
- "Can the same row family be reused outside settings?"

## Problem statement

Right now the shell settings drawer is conceptually correct but architecturally inverted:

- the shell owns the right behavior
- but the shell also owns too much bespoke row rendering

That makes the shell harder to evolve and weakens the DOGFOOD promise:

- the docs are not proving a canonical preference-list family
- shell polish risks becoming trapped inside `app-frame.ts`
- later surfaces may reinvent nearly identical "selected preference rows" instead of reusing a standard component

## Product direction

Bijou should promote the current settings-row presentation into a canonical component family.

Working name:

- `preferenceListSurface()`
- `preferenceRowSurface()`
- optional row helpers for:
  - toggle
  - choice
  - info
  - action

The shell settings drawer should then become:

- shell-owned container behavior
- canonical Bijou preference-list rendering

That split keeps the shell strong without letting it become a custom UI toolkit inside the UI toolkit.

## Principles

1. **DOGFOOD should use canonical componentry**
   If a shell surface becomes polished and reusable, it should graduate into standard Bijou presentation instead of staying bespoke.

2. **The shell owns behavior, not every pixel**
   Drawer placement, input ownership, dismissal, and discoverability belong to the shell. The row family should belong to Bijou componentry.

3. **Preference rows should be semantically legible**
   A user should be able to distinguish:
   - selected row
   - row label
   - current value
   - description
   - toggle vs choice vs info

4. **Compact-width truth matters**
   If the value will collide with the label, the component should adapt honestly by stacking or wrapping rather than truncating into ambiguity.

5. **Persistence is not a default framework concern**
   The component family and shell settings experience should work entirely in memory. Persistence, if added later, should come through an explicit port/adapter, not a hidden framework assumption.

## Proposed component-family scope

### In scope

- canonical preference row rendering
- selected-row treatment
- value-label placement rules
- stacked-value fallback when inline space is too tight
- row descriptions
- row-kind affordances:
  - toggle
  - choice
  - info
  - action
- token-aware theming for:
  - selected state
  - value emphasis
  - muted descriptions

### Out of scope

- persistence of preferences across sessions
- arbitrary form controls embedded inside rows
- editable text fields inside the first preference-list family
- a full application settings persistence framework
- replacing every shell surface with a generic list in the same slice

## Proposed API direction

The exact names can change, but the family should roughly support:

```ts
interface PreferenceRow {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly valueLabel?: string;
  readonly kind?: 'toggle' | 'choice' | 'info' | 'action';
  readonly selected?: boolean;
  readonly checked?: boolean;
  readonly enabled?: boolean;
}

interface PreferenceSection {
  readonly id: string;
  readonly title: string;
  readonly rows: readonly PreferenceRow[];
}
```

The shell can still keep its current higher-level `FrameSettings` model and adapt that model into the canonical row family.

That preserves shell ergonomics while standardizing the actual row rendering.

## Why this matters beyond settings

Once the preference-row family exists, it has clear follow-on value:

- shell settings drawers
- onboarding/tutorial step lists
- notification review rows
- future inspectors or property panels

So this is not just a shell cleanup. It is a design-system promotion step.

## Relationship to DOGFOOD

`DOGFOOD` should remain the first proving surface:

- the shell settings drawer is where the current row treatment became credible
- DOGFOOD should be the first user of the canonical component family
- once that family exists, DOGFOOD stops "special-casing a nice settings menu" and starts proving the actual product vocabulary

That is exactly the kind of migration DOGFOOD should encourage.

## Relationship to settings persistence

Persistence is intentionally not part of this slice.

Framework stance for now:

- settings can live entirely in memory
- the shell can read and write them inside the page/app model
- if persistence is needed later, it should come through a port/adapter boundary
- Bijou should not assume filesystem, database, browser storage, or any other capability by default

That keeps the framework honest and composable.

## Acceptance bar

This direction is successful when:

- the shell settings drawer no longer hand-draws its own special row treatment
- DOGFOOD uses the canonical preference-list family
- the selected-row behavior, value placement, and description rhythm remain at least as good as the current bespoke version
- persistence is still absent by default and explicitly out of scope

## Recommended implementation sequence

1. Write failing design-system / shell tests for canonical preference-row rendering.
2. Build the smallest reusable preference-list surface family.
3. Migrate the shell settings drawer to use it.
4. Keep DOGFOOD as the first proving surface.
5. Only after the row family is stable, consider whether other shell surfaces should adopt it.
