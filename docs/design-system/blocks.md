# Blocks

This document defines what Bijou means by a reusable block.

Blocks are larger, opinionated assemblies built from canonical patterns and component families.

## What a block is

A block is not:

- a one-off demo composition
- a single primitive component
- a shell-specific hack that only one proving surface understands

A block is:

- a reusable product-level assembly
- composed from canonical patterns
- built from existing component families and TUI ownership rules
- documented with clear jobs, ownership, and lowering expectations

Blocks come after doctrine, patterns, and components.

That ordering matters:

1. doctrine explains what good Bijou UX should feel like
2. patterns explain recurring interaction language
3. component families provide reusable primitives
4. blocks compose those primitives into repeatable product structures

If a block appears before the first three layers are clear, it usually hardcodes accidental taste instead of reusable language.

## What blocks should standardize

Blocks should standardize:

- composition
- structure
- copy rhythm
- focus ownership
- common shell or workflow affordances

Blocks should not hide:

- important interaction ownership
- lowering behavior
- accessibility semantics
- localization or directional assumptions

## First credible block candidates

### App frame

The framed shell is already one of Bijou’s strongest recurring structures.

As a future block, `App frame` should standardize:

- pane rhythm
- active-region treatment
- shell header/footer ownership
- shell overlays such as settings and help

### Settings drawer

The settings drawer is a credible future block because it already has:

- canonical preference rows
- shell-owned dismissal and discovery behavior
- stable section rhythm
- truthful active-row treatment

As a block, it should be reusable without depending on DOGFOOD-specific code.

### Notification center

The notification center is a likely future block once Humane Terminal work resumes.

It should eventually standardize:

- notice rows
- archive/history review
- filter rhythm
- shell-owned interrupt versus review behavior

### Guided flow

Guided flow is the general block family for:

- onboarding
- setup sequences
- explainability walkthroughs
- multi-step assisted flows

This should compose:

- preference rows
- alerts and notes
- stepper or timeline language
- explicit next actions

DL-005 now proves the first canonical seam in this family through `explainability()`, which turns the AI explainability doctrine into a structured guided-flow surface instead of leaving it as prose only.

### Inspector panel

An inspector-style side panel is another strong candidate because it naturally combines:

- titled sections
- supporting copy
- current-value emphasis
- compact but calm spacing

DL-006 now proves the first canonical seam in this family through `inspector()`, which turns inspector-panel rhythm into a reusable core component instead of leaving it trapped in a bespoke DOGFOOD detail box.

## Block acceptance bar

A structure is ready to become a canonical block when:

- it recurs across more than one surface or product need
- its interaction ownership is stable
- its patterns are already canonical elsewhere
- its lowering story is explicit
- it improves reuse instead of trapping more quality inside one shell

## What not to do

- do not promote every nice-looking demo into a block
- do not let blocks bypass canonical patterns
- do not let blocks become storage, service, or app-domain assumptions
- do not treat blocks as the first place where accessibility or localization is considered

## Relationship to the current cycle

DL-002 does not implement a blocks runtime.

This cycle exists to make the block layer explicit so future cycles can promote real recurring structures deliberately instead of accidentally.
