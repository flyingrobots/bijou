# `tree()`

Passive hierarchical view for parent/child nesting.

![demo](demo.gif)

## Run

```sh
npx tsx examples/tree/main.ts
```

## Use this when

- parent/child nesting is the mental model
- the user should read hierarchy, not operate a full browser-like workspace
- indentation and containment communicate the meaning better than columns

## Choose something else when

- choose `filePickerSurface()` when the interaction is really filesystem traversal
- choose `dag()` when multiple parents or dependency flow matter
- choose `table()` when comparison across attributes matters more than nesting

## Right-to-left layout

Pass `direction: 'rtl'`, or create the context with `direction: 'rtl'`. In `interactive` and
`static` output the tree indents from the right and its connectors mirror
(`├─` becomes `─┤`, `└─` becomes `─┘`; `│` and `─` map to themselves). Lines are padded on the left to the
widest line by display width, so no width option is needed. Labels are never reversed. `pipe` and
`accessible` output keep the logical indented order.

## What this example proves

- `tree()` as a passive hierarchy renderer
- readable nesting that still makes sense when flattened into textual output
- the distinction between general hierarchy display and richer interactive browsing families

[← Examples](../README.md)
