# `v3-motion`

Canonical motion demo for V3.

It proves:
- keyed layout tracking with `motion({ key })`,
- spring transitions with a named spring preset,
- tween transitions with an explicit duration,
- initial position offsets on first appearance.

Run it with:

```bash
npx tsx examples/v3-motion/main.ts
```

What to look for:
- the green card eases into place with a spring,
- the amber card follows on a timed tween,
- arrow keys move both cards together,
- `q` exits.
