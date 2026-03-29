# AI Explainability Standard

_Design note for explicit, governed AI-mediated UX in Bijou surfaces_

## Why this exists

If Bijou is going to support AI-mediated interfaces, suggestions, assistants, or explainability surfaces, it needs a product standard that is stricter than “show some generated text.”

The `xyph` TUI already demonstrates a strong pattern:

- visible `[AI]` labeling
- explicit explainability sections
- rationale and evidence
- expected next action
- confidence-aware posture

Bijou should adopt that seriousness as doctrine.

AI output should never feel like:

- hidden automation
- unexplained authority
- decorative speculation

## Product stance

AI-mediated UI in Bijou should be:

- explicit
- attributable
- explainable
- actionable
- governed

AI should surface as advisory or assistive unless the app explicitly states otherwise.

Users should be able to answer:

- what is AI-generated here?
- why is it being shown?
- what evidence or basis does it rely on?
- what am I expected to do with it?
- how confident is it?

## Core principles

### 1. Mark AI visibly

AI-mediated content should use an explicit `[AI]` marker or equivalent canonical treatment.

The user should not have to infer that a suggestion, explanation, or summary came from an agent.

That marker should be part of a canonical explainability component/pattern, not a one-off badge.

### 2. Explain why

AI output should include or make available:

- why it was suggested
- what it is based on
- what decision or workflow it is trying to support

### 3. Separate evidence from recommendation

Recommendation should not masquerade as fact.

Bijou should encourage surfaces that distinguish:

- observation
- evidence
- recommendation
- next action

### 4. Confidence must be interpretable

If confidence is shown, it should be attached to explainable reasoning rather than used as mystical authority.

Confidence without context increases user anxiety and misuse.

### 5. AI should lead to governed next actions

A useful AI surface should make it clear what comes next:

- review
- accept
- reject
- inspect more evidence
- do nothing

### 6. AI should reduce ambiguity, not add it

An explainability surface is successful when it lowers uncertainty.

It is unsuccessful when it adds more jargon or produces an attractive wall of text without operational value.

## Canonical explainability fields

Bijou should gradually standardize around explainability structures like:

- label: `[AI]`
- artifact kind
- source
- source mode
- rationale / why
- evidence basis
- confidence
- expected next action
- governance or review note

This does not have to be one monolithic component immediately.

It does need to become a consistent standard.

## DOGFOOD and docs implication

DOGFOOD should eventually teach AI-mediated surfaces the same way it teaches other component families:

- labeled clearly
- explained honestly
- shown with rationale and next-action posture

This is especially important if Bijou later grows:

- AI-assisted blocks
- AI-authored settings or recommendations
- design/debug assistants

## Relationship to XYPH

This direction is influenced by the stronger explainability posture already present in `xyph`, including:

- explicit `[AI]` labeling in TUI views
- structured explainability bodies
- rationale and evidence sections
- confidence-aware governance posture

Bijou should learn from that standard rather than reinventing a weaker one.

## Relationship to other doctrine

This note should be read alongside:

- [Bijou UX Doctrine](./bijou-ux-doctrine.md)
- [Content Guide](./content-guide.md)
- [Accessibility and Assistive Modes](./accessibility-and-assistive-modes.md)

## Acceptance bar

This direction is working when:

- AI-mediated surfaces in Bijou are visibly marked
- explainability becomes a product standard rather than ad hoc copy
- users can understand why an AI artifact is present and what they should do next
- the framework encourages governed, attributable AI experiences instead of mysterious ones
