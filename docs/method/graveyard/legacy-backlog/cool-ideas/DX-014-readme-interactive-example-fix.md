# DX-014 — Fix Root README Interactive Example

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

The interactive runtime example in the root README doesn't show the
mandatory `initDefaultContext()` call. A developer copying the
example into a new file gets:

```
Error: No default BijouContext has been set.
```

Add `import { initDefaultContext } from '@flyingrobots/bijou-node'`
and `initDefaultContext()` to the example so it's copy-pasteable
without hidden prerequisites.

## Why

This is the #1 TTV barrier from the documentation audit. The
scaffolded path handles it automatically, but anyone integrating
into an existing project hits this wall on their first attempt.

## Effort

Tiny — two lines added to the README example.
