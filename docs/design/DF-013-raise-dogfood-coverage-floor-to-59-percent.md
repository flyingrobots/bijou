# DF-013 — Raise DOGFOOD Coverage Floor to 59%

Legend:

- [DF — DOGFOOD Field Guide](/Users/james/git/bijou/docs/legends/DF-dogfood-field-guide.md)

Depends on:

- [DF-012 — Raise DOGFOOD Coverage Floor to 54%](/Users/james/git/bijou/docs/design/DF-012-raise-dogfood-coverage-floor-to-54-percent.md)

## Why this cycle exists

DF-012 broadened DOGFOOD with calmer structural teaching surfaces through explainability and dividers.

The next promised step is now explicit:

- DOGFOOD currently documents 21 of 35 component families
- the enforced floor is 54%
- the next declared target is 59%

This cycle exists to earn that next target through two shell-facing TUI families that make the field guide feel more like a whole application environment instead of only a catalog of component primitives:

- `helpView()` / `helpShortSurface()` for **Keybinding help and shell hints**
- `renderNotificationStack()` / `renderNotificationHistorySurface()` for **Notification system**

## Scope of this cycle

This cycle intentionally covers:

- adding enough real DOGFOOD component stories to move coverage from 21 to 23 families
- documenting keybinding help and shell hints through the real help-view APIs
- documenting the notification system through the real stack and history APIs
- raising the enforced floor from 54% to 59%
- raising the next declared target from 59% to 64%

It does **not** include:

- covering the whole app shell or workspace-layout families yet
- a full interactive notification lab inside DOGFOOD
- changing the canonical denominator
- pretending DOGFOOD now fully documents every shell surface

## Human users

### Primary human user

A builder evaluating whether DOGFOOD can now teach richer shell-owned TUI patterns instead of stopping at individual widgets and forms.

They need:

- one story that shows full grouped help plus compact shell hints through the actual help APIs
- one story that shows transient notification stacking alongside archived review/history through the actual notification-system APIs
- coverage progress that rises only because those shell-facing families are genuinely present

### Human hill

A user can open DOGFOOD, learn when to use the help-view family and when to use the notification system family, and trust the higher coverage number because those families are actually represented in the field guide.

## Agent users

### Primary agent user

An agent tasked with continuing the DOGFOOD ratchet without turning the field guide into a one-note list of static display primitives.

It needs:

- a clear smallest honest route from 54% to 59%
- tests that prove which shell-facing families were added
- at least one docs-app integration check that the new stories are reachable through component search

### Agent hill

An agent can raise DOGFOOD to the 59% floor only by adding real help and notification-system stories, and the cycle tests prove both the coverage increase and the new floor policy.

## Human playback

1. A user enters DOGFOOD and opens the new help-view story.
2. They can see one compact hint strip and one grouped keybinding reference that clearly teach scope and grouping.
3. They open the new notification-system story and can see both live stacked notifications and an archived notification-history review surface.
4. The docs coverage card reports a higher percentage that corresponds to those real new stories.

## Agent playback

1. An agent opens the DF-013 cycle doc.
2. It can see that the target floor is 59% and that the intended route is `keybinding-help-and-shell-hints` plus `notification-system`.
3. It adds real DOGFOOD stories for those families.
4. It updates the floor policy only after those stories exist.
5. The cycle tests and gate confirm that coverage is now 66%, which safely clears the 59% floor, and the next target is recorded as 64%.

## Linked invariants

- [Tests Are the Spec](/Users/james/git/bijou/docs/invariants/tests-are-the-spec.md)
- [Docs Are the Demo](/Users/james/git/bijou/docs/invariants/docs-are-the-demo.md)
- [Visible Controls Are a Promise](/Users/james/git/bijou/docs/invariants/visible-controls-are-a-promise.md)

## Invariants for this cycle

- the floor must move only after real coverage moves
- help coverage must use the actual help APIs and keep grouped reference distinct from short shell hints
- notification-system coverage must show real system behavior like stack/history, not just a single toast primitive
- the new families must be backed by real DOGFOOD stories
- the denominator must still come from the canonical component-family reference

## Implementation outline

1. Move DF-013 into the active cycle area and enrich it with playbacks and invariants.
2. Write failing cycle tests that demand:
   - 23 of 35 documented families and 66% real coverage
   - coverage of `Keybinding help and shell hints` and `Notification system`
   - an enforced floor of 59 with a next target of 64
   - real help and notification-system stories in DOGFOOD
3. Add the smallest honest DOGFOOD stories needed to hit the target.
4. Raise the floor policy and spawn the next ratchet backlog item.
5. Close the cycle with retrospective notes describing what actually landed.

## Tests to write first

Under `tests/cycles/DF-013/`:

- the active cycle doc includes the required workflow sections
- DOGFOOD coverage resolves to 23 of 35 families and 66%
- the story catalog now covers `Keybinding help and shell hints` and `Notification system`
- the enforced floor is 59 and the next target is 64
- the next DOGFOOD backlog item exists

And in the DOGFOOD preview integration bar:

- the new help story is reachable in component search and renders recognizable grouped-help content

## Risks

- making the help story feel like a generic text card instead of a keyboard-owned reference surface
- making the notification story show only one toast instead of a real system with stack/history semantics
- raising the floor without enough actual shell-teaching value for builders evaluating TUI application behavior

## Out of scope

- full app-shell coverage
- workspace-layout coverage
- complete DOGFOOD coverage

## Retrospective

### What landed

- a new real help story teaching `helpView()` and `helpShortSurface()` under the `Keybinding help and shell hints` family
- a new real notification-system story teaching stacked live notifications and archived notification history through the actual TUI notification APIs
- canonical family coverage increased from `21/35` to `23/35`
- DOGFOOD docs coverage now resolves to `66%`, which safely clears the `59%` floor
- the enforced floor moved from `54%` to `59%`
- the next declared target moved from `59%` to `64%`

### Drift from ideal

No material drift.

The cycle stayed focused on shell-facing teaching value rather than simply adding more visual primitives. DOGFOOD now explains both shortcut discovery and recallable transient messaging through the same real APIs builders would use in product code.

### Debt spawned

Spawned:

- [DF-014 — Raise DOGFOOD Coverage Floor to 64%](/Users/james/git/bijou/docs/design/DF-014-raise-dogfood-coverage-floor-to-64-percent.md)
