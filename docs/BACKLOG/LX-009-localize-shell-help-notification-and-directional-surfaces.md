# LX-009 — Localize Shell Help, Notification, and Directional Surfaces

Legend: [LX — Localization and Bidirectionality](/Users/james/git/bijou/docs/legends/LX-localization-and-bidirectionality.md)

## Idea

LX-008 proved the shell i18n seam in real product surfaces:

- frame-owned shell copy can come from catalogs
- DOGFOOD can load localized shell and app copy
- shell direction metadata can drive at least one visible mirrored behavior

The next slice should finish the most obvious remaining gaps:

- help overlay binding descriptions and grouping copy
- notification-center history/body strings and filters
- broader logical-direction behavior in shell-owned drawers and related chrome

## Why

LX-008 intentionally stopped once the i18n seam was real.

That was the correct stopping point, but it leaves visible English islands and only partial direction-aware shell behavior. LX-009 should tighten those gaps before we claim the shell is broadly localized.

## Status

Backlog spawned by the retrospective for LX-008.
