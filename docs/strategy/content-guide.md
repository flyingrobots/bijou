# Content Guide

_Voice, tone, and copy doctrine for Bijou interfaces_

## Why this exists

In Bijou, words are part of the product.

This is especially true in terminal interfaces, where:

- labels are compact
- hints compete for space
- accessible and pipe modes rely heavily on text
- empty states and confirmations must do real orientation work

This guide exists to keep Bijou copy:

- calm
- clear
- localizable
- accessible
- operationally honest

## Voice

Bijou copy should sound:

- direct
- calm
- precise
- unpretentious

Avoid copy that feels:

- hyped
- mysterious
- overly cute
- apologetic
- passive when action is needed

## Tone by surface

### Shell chrome

Shell copy should be terse and operational.

Examples:

- `? Help`
- `/ Search`
- `F2 Settings`

Chrome should not carry essay-length explanation.

### Empty states

Empty states should orient.

They should answer:

- what this place is
- why it is empty
- what to do next

They should not default to:

- “Nothing here”
- “No data”
- “Oops”

### Confirmations

Confirmations should state consequence, not merely ask a generic yes/no question.

Good:

- `Quit Bijou Docs?`
- `Discard unsaved filter changes?`

Better body copy:

- what will happen
- what will not happen
- what the safe choice is when needed

### Errors

Errors should try to provide:

- what happened
- basis if known
- next action if possible

Avoid vague panic language.

### Notifications

Notifications should be short, factual, and scannable.

They should confirm:

- what changed
- what succeeded
- what needs attention

without pretending to be a full explanation surface when they are not.

## Writing rules

### 1. Prefer explicit over clever

Especially in:

- accessible mode
- onboarding copy
- help
- confirmations

### 2. Use verb-first action labels

Examples:

- `Open settings`
- `Search components`
- `Dismiss notification`

### 3. Avoid unexplained jargon in first-use paths

Terms like:

- lane
- pane
- profile
- lowering

should be introduced with care when the user is new.

### 4. Treat hint bars as scarce space

Hints should be:

- short
- truthful
- current

They should not attempt to explain the whole app.

### 5. Write for localization

Avoid:

- English-specific jokes
- brittle idioms
- copy that only works at one exact length

### 6. Write for accessible linear reading

When a surface lowers to accessible mode, the copy should still make sense when read top-to-bottom with no spatial context.

## AI-specific copy posture

When AI is present:

- mark it
- explain why it is present
- explain what the user should do next
- avoid anthropomorphic bluffing

See [AI Explainability Standard](./ai-explainability-standard.md).

## Relationship to other doctrine

This note should be read alongside:

- [Bijou UX Doctrine](./bijou-ux-doctrine.md)
- [Accessibility and Assistive Modes](./accessibility-and-assistive-modes.md)
- [Localization and Bidirectionality](./localization-and-bidirectionality.md)
- [AI Explainability Standard](./ai-explainability-standard.md)

## Acceptance bar

This guide is working when:

- shell copy is consistent and calm
- empty states teach instead of merely reporting absence
- confirmations explain consequence
- accessible and localized surfaces have usable prose
- Bijou’s tone feels intentional across apps and docs
