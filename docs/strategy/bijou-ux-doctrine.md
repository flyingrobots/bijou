# Bijou UX Doctrine

_Human-centered product doctrine for Bijou as a terminal UI framework_

## Why this exists

Bijou now has enough surface area that local good decisions are no longer enough.

We have:

- a framed app shell
- search, help, settings, notifications, and quit flows
- canonical components with graceful lowering
- a real DOGFOOD surface that proves the framework in public

That is the point where a framework needs more than component docs and API notes.

It needs a product doctrine.

This note exists to define what good Bijou TUI UX should feel like for humans:

- calm instead of noisy
- legible instead of clever
- explicit instead of mysterious
- safe instead of brittle
- adaptable instead of assuming one user, one language, one terminal, or one set of abilities

This is not a component catalog.

This is the north star that should guide:

- component families
- shell behavior
- accessibility work
- localization work
- AI/explainability work
- content style
- future blocks and templates

## Design-thinking frame

### Primary user

The primary user is the **operator**:

- a human inside a terminal
- often focused on a task rather than on learning Bijou itself
- sometimes new to the app
- sometimes under time pressure
- sometimes using a constrained terminal, assistive technology, or non-default locale

They are asking:

- "Where am I?"
- "What can I do right now?"
- "What just changed?"
- "How do I get help without getting lost?"
- "Can I trust what this interface is telling me?"

### Secondary user

The secondary user is the **builder**:

- a developer building on Bijou
- someone who wants polished, humane defaults
- someone who should not need to reinvent shell UX, accessibility posture, or content doctrine from scratch

They are asking:

- "What does a good Bijou app feel like?"
- "Which concerns belong to components, the shell, or the app?"
- "How do I build something expressive without drifting into chaos?"

## Product promise

Bijou should help developers build TUIs that feel:

- focused
- calm
- explicit
- reversible
- learnable
- governable

Bijou should avoid encouraging interfaces that feel:

- cryptic
- over-decorated
- keyboard-trap heavy
- color-dependent
- spatially clever but semantically vague
- inaccessible by default

## Core principles

### 1. Focus owns input

The active thing should be obvious.

The active thing should own the controls.

The user should not have to wonder whether:

- a key affects the left pane or the right pane
- a modal is still intercepting input
- a footer hint is stale

### 2. Visible controls are a promise

If a control hint is visible, it should work right now for the active layer.

Do not advertise controls that:

- belong to a hidden pane
- belong to a covered layer
- only work in another mode

Missing hints are better than lies.

### 3. Selection should be structural, not only chromatic

Selection should be visible through:

- background fill
- focus gutter or structural emphasis
- glyph or positional treatment when useful

Color may reinforce selection, but color alone is not enough.

### 4. Density still needs breathing room

TUI density is a strength, not a license to suffocate the interface.

One cell of spacing matters.

Good Bijou layouts should preserve:

- gutters between major structures
- rhythm between sections
- separation between label, value, and description

### 5. The shell is a product

Header, footer, help, search, settings, notifications, and confirmations are not miscellaneous utilities.

They are one human-facing shell.

The shell should:

- orient quickly
- reduce anxiety
- centralize common behavior
- feel consistent across apps

### 6. The docs are the demo

DOGFOOD is not just documentation.

It is the proving surface for Bijou’s own product standards.

That means:

- polished shell behavior should graduate into canonical componentry
- docs should prove lowering, search, settings, and explainability honestly
- one-off “special” UX should be treated with suspicion unless it earns promotion

### 7. Graceful lowering is a product obligation

Rich mode is not the only reality.

Bijou should preserve truth across:

- rich / interactive
- static
- pipe
- accessible

Lower modes do not need visual parity.

They do need semantic honesty.

### 8. Accessibility is broader than an `accessible` string path

An app is not accessible merely because an individual component can lower to plain text.

Bijou must care about:

- reading order
- low vision
- color blindness
- reduced motion
- cognitive load
- assistive interaction

### 9. Localization is not translation after the fact

Locale affects:

- wording
- wrapping
- layout
- reading direction
- formatting
- cognition

Bijou should avoid baking English and LTR assumptions into framework behavior.

### 10. AI surfaces must explain themselves

If AI is present, it must be explicit.

AI-mediated output should communicate:

- what it is
- why it exists
- what evidence it is based on
- what the expected next action is
- how confident it is

### 11. Copy is product behavior

The words in the shell are part of the UX, not garnish.

Good copy should be:

- direct
- calm
- honest
- action-oriented
- localizable
- explicit when accessibility depends on it

### 12. Blocks come after doctrine

Reusable blocks and templates are desirable, but only after:

- doctrine
- patterns
- component vocabulary

Otherwise Bijou will standardize accidental habits instead of intentional design.

## Additional interaction doctrines

### Mouse input should be keyboard-first, mouse-enhanced

Mouse support is valuable, but it should enhance a truthful keyboard model rather than replace it.

Design implications:

- everything important must remain reachable by keyboard
- click should usually mean focus, select, or activate in the active region
- wheel should affect the scoped region under interaction, not some hidden global target
- hover should not be the only place important meaning lives

### Cognitive load should be budgeted

Bijou should treat cognitive load as a design budget, not a post-hoc complaint.

Useful review questions include:

- how many panes are active at once?
- how many actions compete for attention right now?
- how many modes are hidden?
- how many interrupts are stacked?
- how much off-screen state must the user remember?

The goal is not fake numeric precision. The goal is to keep complexity visible and bounded.

## Canonical interaction doctrines

### Selection

Selected list rows should generally use background emphasis rather than only a pointer glyph.

This is the current preferred direction because it:

- survives dense layouts better
- separates row selection from row value text more clearly
- does not depend entirely on hue when paired with structure

### Pane focus

Active pane focus should be signaled structurally:

- gutter
- divider treatment
- footer hints

Not every pane needs a loud visual treatment, but the active region should not be ambiguous.

### Layer ownership

Modal, drawer, palette, and help layers should be mutually honest:

- active layer intercepts relevant input
- inactive layers stop advertising dead controls
- dismissal is predictable

### Status and notification weight

Ephemeral feedback and durable review should be different mechanisms.

Suggested ladder:

- inline note / alert for in-context state
- toast for transient confirmation
- notification center/history for reviewable shell-level notices

### Teaching and onboarding

Empty states and first-run surfaces should teach by orienting the user, not by apologizing for missing data.

They should answer:

- what this place is
- what to do next
- what the primary entry points are

## Scope boundaries

This doctrine does not try to specify every component implementation detail.

That belongs in:

- component-family docs
- shell strategy notes
- specs for particular surfaces

This doctrine does define the quality bar those artifacts should serve.

## Related doctrine notes

The following strategy docs sit beneath this umbrella:

- [The Humane Shell](./humane-shell.md)
- [Accessibility and Assistive Modes](./accessibility-and-assistive-modes.md)
- [Localization and Bidirectionality](./localization-and-bidirectionality.md)
- [AI Explainability Standard](./ai-explainability-standard.md)
- [Content Guide](./content-guide.md)

## Acceptance bar

This doctrine is doing its job when:

- shell and component decisions can be explained against it
- DOGFOOD becomes a proving surface for these principles instead of a special case
- accessibility, localization, and explainability stop being afterthoughts
- future blocks and templates inherit a coherent human-centered standard
