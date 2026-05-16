---
title: DF-062 Audit notification system family across real surfaces
legend: DF
lane: design
priority: medium
keywords:
  - component-audit
  - dogfood
  - lowerings
  - notifications
---

# DF-062 Audit notification system family across real surfaces

## Framing

The notification system is the family for transient events that need more
structure than one directly composed `toast()`: stacking, placement, tones,
actions, dismissal, archive/history review, and shell routing.

This audit verifies the family against real story rendering and runtime
behavior. The point is not to invent another notice component. The point is to
prove that `pushNotification()`, `dismissNotification()`, `tickNotifications()`,
`renderNotificationStack()`, `renderNotificationHistory()`, and framed runtime
notification routing all still describe one coherent system.

## Sponsored Users

- TUI app authors deciding when to use a notification system instead of a
  local toast, alert, log line, drawer, or modal.
- Docs readers switching DOGFOOD between interactive, static, pipe, and
  accessible profiles to see what survives without animation or z-order.
- Maintainers who need one focused regression covering notification lifecycle,
  history, story metadata, and frame-owned routing.

## Hills

1. A builder can inspect DOGFOOD and see live stacks, archived history, and
   frame-routed notifications as one notification-system family.
2. A reader can switch notification stories through every canonical output mode
   without losing tone, action, ordering, recall, or routing facts.
3. A maintainer can run one cycle test that proves notification story docs,
   component-family doctrine, and runtime behavior have not drifted apart.

## Playback Questions

- Do DOGFOOD stories show both full notification-system and app-owned transient
  notification usage?
- Do the stories cover live stack, history review, mixed variants, actions, and
  framed runtime routing?
- Do rich/static previews keep notification chrome, stacking, placement, and
  shell context visible?
- Do pipe and accessible lowerings preserve chronological event text without
  pretending overlay geometry still exists?
- Does the runtime still archive dismissed notifications after their exit
  phase?
- Do framed apps still route runtime issues and page `notify()` commands
  through frame-managed notifications?

## Requirements

- Keep the `notification-system` and `transient-app-notifications` DOGFOOD
  story identities.
- Add a frame-routing variant to the notification-system story.
- Render every notification-system story variant in every canonical story
  profile.
- Exercise the real notification lifecycle: push, tick, dismiss, archive,
  render stack, and render history.
- Exercise framed runtime routing through `createFramedApp()` and `notify()`.
- Keep constrained lowerings plain, chronological, and semantic-preserving.

## Acceptance Criteria

- `tests/cycles/DF-062/notification-system-family-audit.test.ts` proves the
  cycle doc carries the modern playback sections.
- The test locates DOGFOOD stories for `notification-system` and
  `transient-app-notifications`.
- Every documented notification variant renders non-empty output in every
  profile.
- Rich/static output includes structured visual containment; pipe and
  accessible output do not depend on box drawing.
- Constrained lowerings preserve live-stack events, history review, framed
  routing facts, and app-owned transient notices.
- Runtime lifecycle assertions prove notifications can be pushed, ticked,
  dismissed, archived, stacked, and rendered as history.
- Framed app assertions prove runtime issues and page `notify()` commands route
  through frame-managed notifications.

## Implementation Outline

1. Add a framed-routing variant to the notification-system DOGFOOD story.
2. Add a DF-062 cycle test that renders notification stories through the shared
   story protocol.
3. Add runtime assertions for direct notification state and framed app routing.
4. Move the backlog note into `docs/design/` and update the v6 lane pointer.

## Drift Check

The runtime already had deep notification support: stack rendering, history
rendering, animated entry/exit phases, history archive, frame-owned runtime
notifications, and page-level `notify()` routing.

The drift was explanatory. DOGFOOD showed stack and history, but it did not
make frame-routed notifications visible as part of the same family. This slice
adds that story variant and binds it to runtime assertions.

## Playback

- RED: the release lane had only a backlog note, and DOGFOOD did not visibly
  connect frame-managed runtime notifications to the notification-system
  family.
- GREEN: the new cycle test renders notification-system and transient
  notification stories across interactive, static, pipe, and accessible
  profiles.
- Rich/static previews preserve shell context, stacking, placement, and
  notification chrome.
- Pipe previews preserve chronological event and history text without box
  drawing.
- Accessible previews linearize tone, action, recall, and frame-routing facts.
- Runtime assertions prove direct notification lifecycle and framed routing
  behavior.

## Retrospective

This cycle keeps notifications as a system, not a grab bag of overlays. The
important boundary is that local `toast()` is for one directly composed event,
while the notification system owns lifecycle, recall, routing, and shell-level
review.
