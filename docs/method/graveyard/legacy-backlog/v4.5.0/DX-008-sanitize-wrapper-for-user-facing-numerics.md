# DX-008 — Sanitize Wrapper for User-Facing Numeric Inputs

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

Create a small shared utility for clamping and validating user-supplied
numeric values at component boundaries:

```ts
function safeInt(n: number | undefined, fallback: number): number {
  if (n == null || !Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function safeFloat(n: number | undefined, fallback: number): number {
  if (n == null || !Number.isFinite(n)) return fallback;
  return n;
}
```

Every component that accepts `width`, `height`, `min`, `max`, `count`,
etc. from user options would call this instead of raw `??` fallbacks.

## Why

The current pattern — `options.width ?? values.length` — does not
filter `NaN` (which is not nullish). This was the root cause of
multiple v4.4.0 review findings. A shared wrapper makes the correct
pattern easy and the wrong pattern harder.

## Relationship

Complements DX-007 (the audit). DX-007 identifies the gaps; this
provides the tool to close them systematically.
