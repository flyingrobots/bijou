# Architecture — @flyingrobots/bijou

## Overview

bijou's core is a zero-dependency TypeScript library that uses **hexagonal architecture** (Ports and Adapters) to decouple UI components from platform I/O.

Many core components are pure functions that take data and return strings. The package also exposes `Surface` primitives and a smaller set of surface-returning companions for runtime composition. None of that changes the port boundary: no `process`, `chalk`, or `readline` imports leak into the core.

## Ports

Three port interfaces define the boundary between core and platform:

```
┌─────────────────────────────────────────────┐
│  Core (pure TypeScript, zero deps)          │
│                                             │
│  Components ─── Theme Engine ─── Forms      │
│       │              │             │        │
│       └──────── BijouContext ──────┘        │
│                  │   │   │                  │
│           Runtime  IO  Style                │
│            Port   Port  Port                │
└──────────────┼─────┼─────┼──────────────────┘
               │     │     │
          Platform Adapters (bijou-node, test)
```

### RuntimePort

Reads environment state. No side effects.

```typescript
interface RuntimePort {
  env(key: string): string | undefined;
  stdoutIsTTY: boolean;
  stdinIsTTY: boolean;
  columns: number;
  rows: number;
}
```

### IOPort

All I/O operations — writing output, reading input, timers, file access, resize events.

```typescript
interface IOPort {
  write(data: string): void;
  question(prompt: string): Promise<string>;
  rawInput(onKey: (key: string) => void): RawInputHandle;
  onResize(callback: (cols: number, rows: number) => void): RawInputHandle;
  setInterval(callback: () => void, ms: number): TimerHandle;
  readFile(path: string): string;
  readDir(path: string): string[];
  joinPath(...segments: string[]): string;
}
```

### StylePort

Color and text formatting. Implementations can use chalk, ANSI escapes, or return plain text.

```typescript
interface StylePort {
  styled(token: TokenValue, text: string): string;
  rgb(r: number, g: number, b: number, text: string): string;
  hex(color: string, text: string): string;
  bold(text: string): string;
}
```

## BijouContext

The context bundles ports + resolved state:

```typescript
interface BijouContext {
  readonly theme: ResolvedTheme;
  readonly mode: OutputMode;  // 'interactive' | 'static' | 'pipe' | 'accessible'
  readonly runtime: RuntimePort;
  readonly io: IOPort;
  readonly style: StylePort;
}
```

Every component accepts an optional `ctx?: BijouContext`. If omitted, it calls `getDefaultContext()` which returns the global singleton set by `initDefaultContext()`.

## Component Pattern

Many string-first components follow the same structure:

1. Accept content + options (including optional `ctx`)
2. Resolve the context (`ctx ?? getDefaultContext()`)
3. Branch on `ctx.mode` for graceful degradation
4. Return a string — never write to stdout directly

```typescript
export function box(content: string, options: BoxOptions = {}): string {
  const ctx = resolveCtx(options.ctx);
  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return content;  // plain text fallback
  }
  // ... unicode box drawing with ctx.style
}
```

Surface primitives and `*Surface` companions follow the same purity rule, but they return structured render values instead of strings.

## Theme Engine

Themes are typed records mapping canonical token families to `TokenValue`
objects and gradient stops:

```
Theme<StatusKeys, UiKeys, GradientKeys>
  └─ semantic: { primary, muted, accent, success, error, warning, info }
  └─ surface: { primary, secondary, elevated, overlay, muted }
  └─ border: { primary, secondary, success, warning, error, muted }
  └─ status: Record<StatusKeys, TokenValue>
  └─ ui: Record<UiKeys, TokenValue>
  └─ gradient: Record<GradientKeys, GradientStop[]>
```

DTCG interop (`fromDTCG`/`toDTCG`) bridges external design token systems. Theme resolution loads from `BIJOU_THEME` env var, falls back to presets.

The type system defines the token families; the intended first-party usage
rules are documented in
[`docs/design-system/theme-tokens.md`](../../docs/design-system/theme-tokens.md).

## Test Adapters

The `@flyingrobots/bijou/adapters/test` export provides:

- `mockRuntime()` — configurable env, TTY state, dimensions
- `mockIO()` — captures `write()` calls, provides canned answers/keys
- `plainStyle()` — returns text unchanged (no ANSI)
- `createTestContext()` — bundles the above with an explicit `mode`

Tests can assert on returned strings or structured surfaces without process mocking or real TTY simulation.

## Directory Structure

```
src/
├── ports/           # Port interfaces (runtime, io, style, context)
├── adapters/test/   # Test adapter implementations
├── core/
│   ├── components/  # All UI components (box, table, spinner, etc.)
│   ├── forms/       # Interactive form components
│   ├── theme/       # Theme engine, presets, DTCG, gradient
│   └── detect/      # Output mode detection
├── context.ts       # Default context singleton
├── factory.ts       # createBijou() factory
└── index.ts         # Public API barrel
```
