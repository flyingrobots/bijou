# bijou

**The hexagonal toolkit for beautiful, bulletproof terminal interfaces.**

bijou is a professional-grade TUI framework for TypeScript. Zero-dependency core, hexagonal architecture, intelligent graceful degradation across TTY, CI, pipe, and accessible modes.

## Packages

All packages are versioned in lock-step — every release bumps all three to the same version. Internal cross-dependencies are pinned to the exact release version, so `@flyingrobots/bijou-node@0.3.0` always depends on `@flyingrobots/bijou@0.3.0`.

| Package | Description | npm |
| :--- | :--- | :--- |
| [`@flyingrobots/bijou`](./packages/bijou) | Zero-dependency core — components, theme engine, ports | [![npm](https://img.shields.io/npm/v/@flyingrobots/bijou)](https://www.npmjs.com/package/@flyingrobots/bijou) |
| [`@flyingrobots/bijou-node`](./packages/bijou-node) | Node.js adapter — chalk styling, readline I/O, process runtime | [![npm](https://img.shields.io/npm/v/@flyingrobots/bijou-node)](https://www.npmjs.com/package/@flyingrobots/bijou-node) |
| [`@flyingrobots/bijou-tui`](./packages/bijou-tui) | TEA runtime — model/update/view with keyboard input and layout | [![npm](https://img.shields.io/npm/v/@flyingrobots/bijou-tui)](https://www.npmjs.com/package/@flyingrobots/bijou-tui) |

## Quick Start

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { box, headerBox, gradientText } from '@flyingrobots/bijou';

initDefaultContext();

console.log(headerBox('Bijou CLI', { detail: 'v1.0.0' }));
console.log(box('Hello, world!'));
```

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  @flyingrobots/bijou  (zero deps)                        │
│                                                          │
│  Components   Theme Engine   Forms   Detection           │
│  box · table  DTCG · presets input   TTY · CI            │
│  spinner      gradients     select   pipe · a11y         │
│  progress     styled()      confirm                      │
│               extendTheme()  group                       │
│                                                          │
│  ── Ports ─────────────────────────────────────────────  │
│  RuntimePort       IOPort       StylePort                │
└──────┬───────────────┬───────────────┬───────────────────┘
       │               │               │
┌──────▼───────────────▼───────────────▼───────────────────┐
│  @flyingrobots/bijou-node                                │
│  process · readline · chalk · fs                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  @flyingrobots/bijou-tui                                 │
│                                                          │
│  Runtime        Animation       Layout                   │
│  TEA · EventBus spring · tween  flex · viewport          │
│  parseKey       animate · timeline   vstack · hstack     │
│  screen control sequence                                 │
│                                                          │
│  Input                                                   │
│  KeyMap · InputStack · help generator                    │
└──────────────────────────────────────────────────────────┘
```

The core is pure TypeScript. All platform I/O flows through three ports (`RuntimePort`, `IOPort`, `StylePort`), making it testable without mocks and portable to any runtime. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full design.

## Output Modes

bijou detects the environment and adapts rendering automatically:

| Mode | Trigger | Behavior |
| :--- | :--- | :--- |
| **Interactive** | TTY | Full RGB, unicode borders, animations |
| **Static** | `CI=true` | Single-frame, animations disabled |
| **Pipe** | Piped stdout / `TERM=dumb` | Plain text, ASCII fallbacks |
| **Accessible** | `BIJOU_ACCESSIBLE=1` | Screen-reader friendly |

## Components

See the [core package README](./packages/bijou) for the full component catalog:

- **Layout** — `box`, `headerBox`, `separator`
- **Elements** — `badge`, `alert`, `kbd`, `skeleton`
- **Data** — `table`, `tree`, `accordion`, `timeline`
- **Navigation** — `tabs`, `breadcrumb`, `stepper`, `paginator`
- **Animation** — `spinner`, `progressBar`, `gradientText`
- **Forms** — `input`, `select`, `multiselect`, `confirm`, `group`
- **Themes** — DTCG presets (`nord`, `catppuccin`, `cyan-magenta`), `extendTheme()`, `styled()`

## Development

```bash
# Install
npm install

# Build all packages
npm run build

# Run tests
npm test

# Type check
npm run lint

# Bump all packages to a new version
npm run version 0.2.0
```

## Releasing

All packages release together. The workflow:

1. `npm run version X.Y.Z` — bumps all `package.json` files and cross-deps
2. Commit and tag: `git tag vX.Y.Z && git push --tags`
3. CI verifies versions match, builds, tests, then publishes all three packages to npm with OIDC provenance

Pre-release tags are supported: `v0.2.0-rc.1` publishes to `next`, `v0.2.0-beta.1` to `beta`.

## License

MIT
