# HT-006 — Allow pages to push notifications in createFramedApp

Legend: [HT — Humane Terminal](../../legends/HT-humane-terminal.md)

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
