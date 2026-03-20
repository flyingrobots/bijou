# `toast()`, `composite()`

Low-level transient overlay primitive

## Run

```sh
npx tsx examples/toast/main.ts
```

## Use this when

- you are composing a single transient overlay directly
- explicit anchoring matters
- you do not need stack/history management

## Choose something else when

- choose `alert()` when the message should remain in page flow
- choose `notifications` when the app needs stacking, actions, routing, or history

## Code

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, separator } from '@flyingrobots/bijou';
import {
  run, quit, type App, type KeyMsg, type ResizeMsg,
  composite, toast, type ToastVariant, type ToastAnchor,
} from '@flyingrobots/bijou-tui';

const ctx = initDefaultContext();

// ... see main.ts for full implementation ...

    const t = toast({
      message: `Operation \${model.lastToast.variant}!`,
      variant: model.lastToast.variant,
      anchor: model.anchor,
      screenWidth: cols,
      screenHeight: rows,
      ctx,
    });

    return composite(bg, [t]);
```

[← Examples](../README.md)
