# LX — Localization and Bidirectionality

_Legend for making Bijou locale-aware, direction-aware, and ready for real translation workflows_

## Goal

Make localization a first-class Bijou capability rather than a late string-replacement exercise.

This legend covers work like:

- localizable shell chrome
- locale-aware formatting
- direction metadata
- RTL/LTR-safe layout behavior
- catalogs
- translation workflows
- localization tooling

## Human users

- builders shipping Bijou apps in multiple locales
- translators and localization maintainers
- end users reading localized shells and docs

## Agent users

- agents generating shell copy
- agents validating layout under long-string or RTL stress
- agents maintaining catalogs and workflow tooling

## Human hill

A builder can localize Bijou shell/app content without fighting English-only assumptions or inventing their own ad hoc localization substrate.

## Agent hill

An agent can reason about locale, direction, catalogs, and translation workflow data through explicit framework contracts instead of undocumented conventions.

## Core invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)
- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md)
- [Codecs Are Not Domain Models](../invariants/codecs-are-not-domain-models.md)
- [Graceful Lowering Preserves Meaning](../invariants/graceful-lowering-preserves-meaning.md)
- [Docs Are the Demo](../invariants/docs-are-the-demo.md)

## Related doctrine

- [System-Style JavaScript](../system-style-javascript.md)
- [Localization and Bidirectionality](../strategy/localization-and-bidirectionality.md)
- [Content Guide](../strategy/content-guide.md)

## Current cycle and backlog

- latest completed cycle: [LX-009 — Localize Shell Help, Notification, and Directional Surfaces](../retro/LX_009-localize-shell-help-notification-and-directional-surfaces.md)
- live backlog:
  - no dedicated localization cycle is live right now
