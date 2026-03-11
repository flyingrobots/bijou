# `v3-subapp`

Canonical Fractal TEA demo for V3.

It proves:
- `initSubApp()` for child initialization,
- `updateSubApp()` for child lifecycle updates and command mapping,
- `mount()` as the render helper,
- independent child models composed inside one parent shell.

Run it with:

```bash
npx tsx examples/v3-subapp/main.ts
```

What to look for:
- the left and right counters update independently,
- the parent status line reflects which child handled the action,
- `a/z` drive the left counter, `k/m` drive the right counter,
- `q` exits.
