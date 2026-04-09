# Migrating to Bijou 4.3.0

## From 4.2.0

### No breaking changes

This is a performance-focused minor release. All existing public APIs
remain unchanged. The packed surface is an internal implementation
detail — `Surface`, `Cell`, `createSurface`, `set()`, `get()`,
`blit()`, `fill()`, `clear()`, and `clone()` all behave identically.

### New `setRGB()` API

If you have performance-sensitive rendering code that writes cells in
a tight loop, consider using `setRGB()` instead of `set()`:

```ts
// Instead of this (parses hex on every call):
for (let x = 0; x < width; x++) {
  surface.set(x, y, { char: '█', fg: '#ff8800', bg: '#000000' });
}

// Use this (zero-alloc, ~10-50x faster per cell):
for (let x = 0; x < width; x++) {
  surface.setRGB(x, y, 0x2588, 255, 136, 0, 0, 0, 0);
}
```

Pass `-1` for fg or bg RGB values to use the terminal default color.

Use flag constants for modifiers:

```ts
import { FLAG_BOLD, FLAG_DIM } from '@flyingrobots/bijou';

surface.setRGB(x, y, 'A', 255, 255, 255, 0, 0, 0, FLAG_BOLD);
```

### `PackedSurface` type

`createSurface()` now returns `PackedSurface` (which extends
`Surface`). If your code types surfaces explicitly, you can use
either type — `PackedSurface` adds `.buffer`, `.sideTable`, and
`.markAllDirty()` for advanced byte-level access.

### Braille rendering

If you were working around braille corruption in `flexSurface` by
rendering directly to stdout, you can now remove that workaround.
Braille characters (U+2800–U+28FF) are preserved correctly through
the entire surface pipeline.

### Theme token `fgRGB` / `bgRGB`

`TokenValue` now includes optional `fgRGB` and `bgRGB` tuple fields.
If you create custom tokens, you don't need to set these — they're
populated automatically during theme resolution. But if you want to
pre-populate them for performance:

```ts
const token: TokenValue = {
  hex: '#ff8800',
  fgRGB: [255, 136, 0],
};
```
