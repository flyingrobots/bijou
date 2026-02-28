# Feature Request: Canvas Primitive & Box Width Override

**From:** XYPH TUI title screen
**Date:** 2026-02-28
**bijou version:** v0.9.0

---

## Context

XYPH's landing screen renders an animated ASCII spiral shader as a
full-screen background, with the logo and status text inside a solid
bordered box composited on top. With v0.9.0, `composite()` + `box()`
eliminate most of the hand-rolled compositing code, but two gaps remain.

### What v0.9.0 already solves

| Problem | v0.9.0 solution |
|---------|-----------------|
| Row-by-row compositing loop | `composite(bg, [overlay], { dim })` |
| Manual box-drawing characters | `box(content, { borderToken, padding })` |
| Tracking visual widths alongside styled text | `visibleLength()` |
| ANSI-safe background slicing | `sliceAnsi()` via `spliceLine()` internals |
| Centering math | `modal()` pattern (or trivial manual calc) |

---

## Request 1: `canvas()` — Character-grid shader primitive

### Problem

The spiral background is a `(x, y, time) -> character` function evaluated
over a `cols x rows` grid. The tight loop is pure boilerplate:

```typescript
const lines: string[] = [];
for (let y = 0; y < rows; y++) {
  let line = '';
  for (let x = 0; x < cols; x++) {
    line += shaderFn(x, y, cols, rows, time);
  }
  lines.push(line);
}
return lines.join('\n');
```

Every app that wants a procedural background (rain, static, plasma, matrix,
starfield) re-implements this loop. The pattern is general enough to live
in bijou.

### Proposed API

```typescript
// bijou-tui or bijou core

type ShaderFn = (
  x: number,
  y: number,
  cols: number,
  rows: number,
  time: number,
) => string; // single character

function canvas(
  cols: number,
  rows: number,
  shader: ShaderFn,
  time?: number,
): string;
```

**Returns:** A single string of `rows` newline-separated lines, each
`cols` characters wide.

**Behavior:**
- Calls `shader(x, y, cols, rows, time ?? 0)` for every cell
- If the shader returns more than one character, take only the first
- If it returns an empty string, substitute a space
- `time` defaults to `0` for static patterns

### Why bijou, not app code

1. **Reusable** — any TUI splash screen, screensaver, or background effect
   benefits from the same loop.
2. **Optimizable** — bijou could later add row-level string building
   optimizations, canvas caching, or dirty-rect diffing without changing
   the shader contract.
3. **Composable** — `canvas()` output feeds directly into `composite()`
   as a background string. The two together form a complete layered
   rendering pipeline.

### Acceptance criteria

```
canvas()
  ✓ calls shader(x, y, cols, rows, time) for every cell in order
  ✓ produces exactly `rows` lines separated by newlines
  ✓ each line is exactly `cols` characters wide
  ✓ truncates multi-char shader return to first character
  ✓ substitutes space for empty shader return
  ✓ time defaults to 0 when omitted
  ✓ works with cols=0 or rows=0 (returns empty string)
  pipe mode
    ✓ returns empty string (no visual output in pipes)
```

---

## Request 2: `box()` width override

### Problem

`modal()` accepts an optional `width` to force a fixed box size, but
`box()` doesn't. On the XYPH title screen, the box content changes between
states:

| State | Content inside box |
|-------|--------------------|
| Loading | Logo + copyright (2 lines below logo) |
| Error | Logo + copyright + error + "press any key" |
| Ready | Logo + copyright + stats + "press any key" |

The widest content line (the logo) is the same across all states, so the
box width doesn't jump. But the box *height* changes — it's taller in the
ready state than the loading state. If the widest line ever differed between
states (e.g., a long error message), the box would visually jump widths
between frames.

A `width` option on `box()` would let consumers lock the box to a fixed
size for visual stability.

### Proposed API

```typescript
export interface BoxOptions {
  borderToken?: TokenValue;
  padding?: { top?: number; bottom?: number; left?: number; right?: number };
  width?: number;  // <-- new: total outer width (border + padding + content)
  ctx?: BijouContext;
}
```

**Behavior:**
- When `width` is set, the box outer width is fixed to that value
- Content lines shorter than the interior are right-padded with spaces
- Content lines longer than the interior are clipped via `clipToWidth()`
- When `width` is not set, behavior is unchanged (auto-size to content)

### Acceptance criteria

```
box() with width override
  ✓ outer width matches specified width exactly
  ✓ short content lines are right-padded to fill interior
  ✓ long content lines are clipped to interior width
  ✓ padding is subtracted from width to compute interior
  ✓ width < minimum (border + padding) produces zero-width interior
  ✓ visibleLength of every output line equals specified width
```

---

## Non-request: Transparent compositing

Initially considered requesting a `transparent` option for `composite()`
where space characters in the overlay would reveal the background. After
review, `composite()`'s current opaque behavior is correct for the box
use case — the solid interior is the whole point. Transparent compositing
is a different primitive (sprite rendering) and would complicate the
common case. Noting it here as a future thought, not a request.

---

## Usage sketch (v0.9.0 + these two features)

```typescript
import { box } from '@flyingrobots/bijou';
import { composite, canvas } from '@flyingrobots/bijou-tui';
import { spiralShader } from './shaders/spiral.js';

export function landingView(model: DashboardModel): string {
  // 1. Render full-screen spiral background
  const bg = canvas(model.cols, model.rows, spiralShader, Date.now());
  const styledBg = styled(muted, bg);

  // 2. Build foreground content
  const content = [gradientLogo, '', copyright, '', statusText]
    .filter(Boolean).join('\n');

  // 3. Wrap in a fixed-width box
  const panel = box(content, {
    borderToken: border,
    padding: { top: 1, bottom: 1, left: 3, right: 3 },
    width: logoWidth + 8, // lock to logo width + padding + border
  });

  // 4. Center and composite
  const panelLines = panel.split('\n');
  const row = Math.floor((model.rows - panelLines.length) / 2);
  const col = Math.floor((model.cols - visibleLength(panelLines[0])) / 2);

  let result = composite(styledBg, [{ content: panel, row, col }], { dim: true });

  // 5. Progress bar at bottom
  if (model.loading) {
    const bar = progressBar(model.loadingProgress, { width: model.cols });
    result = composite(result, [{ content: bar, row: model.rows - 1, col: 0 }]);
  }

  return result;
}
```

~25 lines vs. the current ~130 lines of manual compositing.
