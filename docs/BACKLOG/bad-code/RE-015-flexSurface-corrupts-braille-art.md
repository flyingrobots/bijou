# RE-015 — flexSurface Corrupts Braille Art Layout

Legend: [RE — Runtime Engine](../../legends/RE-runtime-engine.md)

## Problem

`flexSurface()` visually stretches/distorts content containing braille characters (U+2800–U+28FF). The same content rendered via raw `process.stdout.write()` or plain `console.log()` displays correctly, but passing it through `flexSurface` produces a blown-up, misaligned result.

Observed in Think's splash screen (brain art using braille dot patterns). The art is 77 columns × 34 rows of braille characters. When rendered through `flexSurface` with `align: 'center'`, the output is visibly distorted compared to `cat`-ing the same file.

`parseAnsiToSurface` → cell inspection shows correct 1:1 cell mapping (braille characters are single-width BMP codepoints, `isWideChar` correctly returns `false`). The corruption appears to happen during the surface composition or rendering phase, not during parsing.

## Reproduction

```js
import { flexSurface } from '@flyingrobots/bijou-tui';
import { readFileSync } from 'fs';

// Any multi-line braille art file
const art = readFileSync('braille-art.txt', 'utf8').trimEnd();

// This output is visually distorted vs raw stdout
const surface = flexSurface(
  { direction: 'column', width: 150, height: 43 },
  { flex: 1, content: art, align: 'center' },
);
```

## Workaround

Render braille content directly to stdout, bypassing the surface pipeline entirely.

## Related

Also discovered: `flex()` string-based centering with `align: 'center'` pads lines with regular space (U+0020). When the content uses braille blank (U+2800) as whitespace, terminals render the two at slightly different widths, causing progressive misalignment. A `padChar` option on align children could address this, but it's a separate enhancement.
