# `toast()`, `composite()`

Anchored notification overlay variants

## Run

```sh
npx tsx examples/toast/main.ts
```

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
