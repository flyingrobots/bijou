# canvas

Animated plasma effect using the `canvas()` shader primitive.

## Run

```sh
npx tsx examples/canvas/main.ts
```

## Source (excerpt)

```ts
const CHARS = ' .:-=+*#%@';

const shader: ShaderFn = ({ u, v, time }) => {
  const dx = u - 0.5;
  const dy = (v - 0.5) * 2; // aspect ratio correction
  const dist = Math.sqrt(dx * dx + dy * dy);
  const wave = Math.sin(dist * 10 - time * 3) * 0.5 + 0.5;
  const idx = Math.floor(wave * (CHARS.length - 1));
  return CHARS[idx]!;
};

const art = canvas(60, 20, shader, { time });
```
