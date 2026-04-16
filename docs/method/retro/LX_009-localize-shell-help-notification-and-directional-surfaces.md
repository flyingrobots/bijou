---
title: LX-009 — Localize Shell Help, Notification, and Directional Surfaces
lane: retro
legend: LX
---

# LX-009 — Localize Shell Help, Notification, and Directional Surfaces

## Disposition

Landed in `release/v4.5.0`. Shell help now localizes its default group label,
frame-owned group names, and shell-owned key descriptions through the frame
catalog instead of leaking English strings from static key maps. The
notification-center drawer now localizes its summary rows, filter copy, current
stack label, history header/empty states, and action label through the same
shell i18n seam. The visible logical-direction behavior from LX-008 remains the
active direction contract for shell drawers and related chrome, so the obvious
remaining English islands are no longer a live LX backlog item.

## Original Proposal

Legend: [LX — Localization and Bidirectionality](../legends/LX-localization-and-bidirectionality.md)

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
