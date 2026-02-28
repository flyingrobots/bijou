# canvas

Animated plasma effect using the `canvas()` shader primitive.

## Run

```sh
npx tsx examples/canvas/main.ts
```

## Source (excerpt)

```ts
const CHARS = ' .:-=+*#%@';

const shader: ShaderFn = (x, y, cols, rows, time) => {
  const cx = cols / 2;
  const cy = rows / 2;
  const dx = x - cx;
  const dy = (y - cy) * 2;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const wave = Math.sin(dist * 0.5 - time * 3) * 0.5 + 0.5;
  const idx = Math.floor(wave * (CHARS.length - 1));
  return CHARS[idx]!;
};

const art = canvas(60, 20, shader, { time });
```
