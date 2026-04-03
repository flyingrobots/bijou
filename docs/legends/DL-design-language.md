# DL — Design Language

_Legend for turning Bijou’s growing UX instincts into explicit doctrine, patterns, and reusable product language_

## Goal

Give Bijou a coherent design language that sits above individual components and shell features.

This legend covers work like:

- UX doctrine
- interaction patterns
- accessibility posture
- localization and bidirectionality posture
- AI explainability standards
- content style
- later pattern and block libraries

## Human users

- builders deciding what “good Bijou UX” should feel like
- maintainers reviewing whether new shell or component work drifts from doctrine
- users who benefit from calmer, more consistent TUI behavior even if they never read the docs

## Agent users

- agents generating or auditing Bijou UX
- agents validating shells/components against explicit doctrine instead of taste
- agents maintaining catalogs, accessibility reviews, and explainability surfaces

## Human hill

A builder can explain what good Bijou TUI UX feels like, why, and how to apply it, without reducing that answer to a component inventory.

## Agent hill

An agent can evaluate proposed Bijou UX changes against explicit doctrine, playbacks, and invariants instead of reverse-engineering unwritten style preferences.

## Core invariants

- [Tests Are the Spec](../invariants/tests-are-the-spec.md)
- [Focus Owns Input](../invariants/focus-owns-input.md)
- [Visible Controls Are a Promise](../invariants/visible-controls-are-a-promise.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Related doctrine

- [Bijou UX Doctrine](../strategy/bijou-ux-doctrine.md)
- [Accessibility and Assistive Modes](../strategy/accessibility-and-assistive-modes.md)
- [Localization and Bidirectionality](../strategy/localization-and-bidirectionality.md)
- [AI Explainability Standard](../strategy/ai-explainability-standard.md)
- [Content Guide](../strategy/content-guide.md)

## Current cycle and backlog

- latest completed cycle: [DL-007 — Promote Inspector Panel Block](../design/DL-007-promote-inspector-panel-block.md)
- live backlog:
  - [DL-009 — Formalize Layout and Viewport Rules](../BACKLOG/up-next/DL-009-formalize-layout-and-viewport-rules.md)
  - [DL-008 — Promote Guided Flow Block](../BACKLOG/DL-008-promote-guided-flow-block.md)
