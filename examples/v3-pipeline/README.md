# `v3-pipeline`

Canonical programmable-pipeline demo for V3.

It proves:
- `run(app, { configurePipeline })` can extend the render pipeline,
- custom middleware can mutate the `targetSurface` in `PostProcess`,
- the effect composes with ordinary surface-native views.

Run it with:

```bash
npx tsx examples/v3-pipeline/main.ts
```

What to look for:
- alternating scanlines dim the rendered card,
- `SPACE` toggles the post-process middleware effect,
- `q` exits.
