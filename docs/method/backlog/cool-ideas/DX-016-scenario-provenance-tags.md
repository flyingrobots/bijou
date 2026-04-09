# DX-016 — Scenario Provenance Tags For Intelligent Bench Filtering

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

Add a `tags: readonly string[]` field to the `Scenario` interface
in `bench/src/scenarios/types.ts`. Tags describe what a scenario
exercises, not what it looks like:

```ts
interface Scenario<State> {
  // ...existing fields...
  readonly tags: readonly string[];
}

// Example:
export const paintGradientRgb: Scenario<State> = {
  id: 'paint-gradient-rgb',
  tags: ['paint', 'setRGB', 'unique-styles', 'no-hex-parse'],
  // ...
};
```

Harnesses can then filter:

```bash
# Run everything that exercises the diff path
bench run --tag=diff

# Run everything that stresses unique style count
bench run --tag=unique-styles

# Run the RE-017 gate set
bench run --tag=re017-gate
```

Multi-tag logic: `--tag=paint,diff` = AND, `--tag=paint --tag=diff`
= OR (or pick one convention and document it).

## Why

The scenario registry will grow. RE-017 has 4 scenarios today but
the full target is 20+ across paint / diff / layout / compose /
text categories. Running "all scenarios" will become slow and
scatter attention. We need a way to say "just run the ones that
could have been affected by my change":

- Touched the differ? `--tag=diff`
- Touched the layout engine? `--tag=layout`
- Touched hex parsing? `--tag=hex-parse`
- Landing a perf optimization that only affects paint? `--tag=paint`

## Why This Is Cool

1. **Lets CI gates be precise.** A PR that only touches the layout
   code can run `--tag=layout` in CI and skip diff scenarios —
   faster feedback, same signal.
2. **Self-documenting.** Tags describe the *intent* of each
   scenario. Reading the registry at a glance tells you what's
   covered and where gaps are.
3. **Enables coverage tracking.** "Do we have a scenario tagged
   `emoji`?" becomes easy to answer. Missing tags = missing
   coverage.
4. **Pairs with the sandbox harness.** The interactive sandbox
   (task I-7) could offer tag-based scenario selection in its UI.

## Shape

Propose a tag vocabulary (append as the registry grows):

- **Path tags:** `paint`, `diff`, `layout`, `normalize`, `compose`,
  `runtime`.
- **API tags:** `set`, `setRGB`, `blit`, `fill`, `clear`.
- **Stress tags:** `unique-styles`, `sparse-diff`, `dense-diff`,
  `hex-parse`, `side-table`, `emoji`, `wide-char`.
- **Shape tags:** `small`, `medium`, `large`, `xlarge`.
- **Gate tags:** `re017-gate`, `smoke`, `nightly`.

A scenario typically has 3-5 tags. Tags are lowercase, hyphenated,
stable (renaming a tag is a backwards-incompatible change).

## Related

- `bench/src/scenarios/types.ts` — where the field lands.
- `bench/src/cli.ts` — where `--tag` is consumed.
- Task `#18` (I-7) — sandbox can use tags for scenario selection.
- Task `#35` — the CI gate that consumes tag filters.
