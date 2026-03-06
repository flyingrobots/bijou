# `renderByMode()`

Custom mode-aware themed components

## Run

```sh
npx tsx examples/custom-component/main.ts
```

## Code

```typescript
import { renderByMode, resolveCtx, type BijouContext } from '@flyingrobots/bijou';

function spark(label: string, value: string, options: { ctx?: BijouContext } = {}) {
  const ctx = resolveCtx(options.ctx);

  return renderByMode(ctx.mode, {
    pipe: () => `[\${label.toUpperCase()}] \${value}`,
    accessible: () => `Status \${label}: \${value}.`,
    interactive: () => {
      const accent = ctx.semantic('accent');
      const muted = ctx.semantic('muted');
      const sparkIcon = ctx.style.styled(accent, '\u2728');
      const labelStyled = ctx.style.bold(label);
      const valueStyled = ctx.style.styled(muted, value);
      return `\${sparkIcon} \${labelStyled}: \${valueStyled}`;
    },
  }, options);
}
```

[← Examples](../README.md)
