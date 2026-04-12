# @flyingrobots/bijou

The pure, zero-dependency core of Bijou.

`@flyingrobots/bijou` provides the foundational primitives for CLIs, prompts, and portable terminal output. It manages components, themes, environment detection, and the core `Surface` and `LayoutNode` types.

## Role

- **Degradation-First**: Automatic mode detection for `interactive`, `static`, `pipe`, and `accessible` output.
- **Mixed-Mode**: High-performance `Surface` primitives for rich apps, plus string-first helpers for standalone scripts.
- **Hexagonal Core**: Pure TypeScript logic isolated from platform IO via `Runtime`, `IO`, and `Style` ports.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Quick Start

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, boxSurface, tableSurface } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

const panel = boxSurface(
  tableSurface({
    columns: [{ header: 'Service' }, { header: 'Status' }],
    rows: [['api', badge('LIVE', { variant: 'success', ctx })]],
    ctx,
  }),
  { title: 'Runtime', padding: 1, ctx },
);
```

## Strategy: Choosing Component Families

Select the family based on the interaction semantic, not just the visual shape.

### Status and Feedback
- **`badge()`**: Compact, inline status.
- **`note()`**: Non-urgent explanation.
- **`alert()`**: Persistent, in-flow message.
- *Use `@flyingrobots/bijou-tui` notifications for stacking, history, or active routing.*

### Selection and Prompts
- **`select()`**: Single choice from a stable set.
- **`filter()`**: Search-led choice from a large or dynamic set.
- **`multiselect()`**: Choosing multiple values to build a set.
- **`confirm()`**: Strictly binary decisions.

### Hierarchy and Chronology
- **`tree()`**: Parent/child nesting.
- **`timeline()`**: Sequential, time-ordered events.
- **`dag()`**: Causal or dependency-based graphs.

### Progress and Wayfinding
- **`progressBar()`**: Determinate completion.
- **`spinner()`**: Indeterminate activity.
- **`breadcrumb()`**: Path context.
- **`stepper()`**: Ordered stages in a linear process.

## Documentation

- **[GUIDE.md](./GUIDE.md)**: Productive-fast path.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)**: Rendering doctrine, themes, and testing.
- **[Design System](../../docs/design-system/README.md)**: Semantic guidance and component families.

---
Built with 💎 by [FLYING ROBOTS](https://github.com/flyingrobots)
