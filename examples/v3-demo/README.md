# `v3-demo`

The smallest canonical Bijou V3 app.

It proves:
- the public `App` contract accepts a surface-first view,
- a V3 app can size itself from the Bijou runtime context instead of `process.stdout`,
- core visual primitives compose without dropping back to legacy string rendering.

Run it with:

```bash
npx tsx examples/v3-demo/main.ts
```

What to look for:
- a centered starter card,
- live terminal dimensions in the UI,
- `SPACE` increments the counter,
- `q` or `ctrl+c` exits cleanly.
