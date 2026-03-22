# `canvas()`, `ShaderFn`

Animated shader surface for deliberate visual moments.

## Run

```sh
npx tsx examples/canvas/main.ts
```

## Use this when

- the app needs a purposeful visual field such as a splash screen or atmospheric background
- the effect supports mood, transition, or identity instead of carrying core task meaning
- the visual surface is allowed to be expressive without blocking comprehension

## Choose something else when

- choose ordinary layout and status surfaces for routine productivity screens
- choose a simpler transition or status cue when the effect would distract from the actual task

## What this example proves

- `canvas()` as a shader-driven surface primitive
- `ShaderFn` over normalized UV coordinates and time
- a visual effect that still degrades honestly when animation is absent

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

[← Examples](../README.md)
