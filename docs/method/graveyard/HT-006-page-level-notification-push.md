---
title: HT-006 — Allow pages to push notifications in createFramedApp
lane: graveyard
legend: HT
---

# HT-006 — Allow pages to push notifications in createFramedApp

## Disposition

Landed in `release/v4.5.0`. `createFramedApp()` now exposes `emitFrameAction()` and `notify()` so framed pages can emit shell-owned transient notifications without reaching into frame state, the page command wrapper preserves frame-scoped messages instead of re-wrapping them as page messages, focused `app-frame` coverage proves the runtime path, and the TUI guides now document the seam.

## Original Proposal

Legend: [HT — Humane Terminal](../legends/HT-humane-terminal.md)

## Problem

Pages in `createFramedApp` cannot push transient notifications. The `pushNotification` function operates on `FrameModel.runtimeNotifications`, but pages only return `[PageModel, Cmd<Msg>[]]` — they have no access to frame-level state.

Currently only the frame shell itself can push notifications (settings feedback, runtime issues). Page-level events like "No more thoughts in this session" have no way to surface as notifications.

## Proposal

Add a `push-notification` FrameAction that pages can emit via a command:

```js
// In page update:
return [model, [emitFrameAction({ type: 'push-notification', title: 'End of session', durationMs: 2000 })]];
```

Or expose a `notify()` command helper:

```js
import { notify } from '@flyingrobots/bijou-tui';
return [model, [notify({ title: 'End of session', variant: 'TOAST', durationMs: 2000 })]];
```

## Workaround

Render the notice as a positioned overlay via `overlayFactory`, which has access to the page model.
