# RE-009 — Fix O(n²) String Concatenation in renderDiff

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Problem

`renderDiff()` in `packages/bijou/src/core/render/differ.ts` builds
the output string via `output += ...` and `batchText += c.char` in
loops. For a full-screen repaint of a wide terminal, this is O(n²)
string concatenation.

## Evidence

From the perf-gradient stress test: at 191×48 (9,168 cells) with
the gradient mode (every cell unique), the differ is the dominant
frame-time cost. String concatenation in the inner loop contributes
to the ~17ms pipeline overhead per frame.

## Fix

Replace string concatenation with array accumulation:

```typescript
const parts: string[] = [];
// ...
parts.push(moveCursor(x, y));
parts.push(style.styled(token, batchText));
// ...
output = parts.join('');
```

Same for `batchText` — use `batchChars.push(c.char)` then
`batchChars.join('')`.

## Effort

Small — localized change in one function.
