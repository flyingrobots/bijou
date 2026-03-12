# `v3-css`

Canonical BCSS demo for V3.

It proves:
- type selectors on `Badge` and `Box`,
- class selectors via `.active` and `.warning`,
- id selectors via `#hero-box`,
- `var(token.path)` resolution through the token graph,
- `@media (width < 80)` behavior in the runtime path.

Current scope:
- BCSS is guaranteed on the supported V3 surface primitives used here and on framed shell regions like `FrameHeader`, `FrameHelp`, and `FocusArea`.
- It is not yet a global cascade for arbitrary layout nodes or every legacy string component.

Run it with:

```bash
npx tsx examples/v3-css/main.ts
```

What to look for:
- badges and the surrounding box pick up BCSS colors,
- shrinking the terminal below 80 columns swaps the box styling,
- `q` exits.
