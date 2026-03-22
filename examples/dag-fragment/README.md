# `dagSlice()` + `dag()`

Focused DAG slices for local dependency review.

![demo](demo.gif)

## Run

```sh
npx tsx examples/dag-fragment/main.ts
```

## Use this when

- the full graph is too large to be the honest scope
- the question is local, such as ancestors, descendants, or a neighborhood
- you want to preserve graph semantics without making the reader pay for the entire network

## Choose something else when

- choose plain `dag()` when the full dependency shape is still readable and relevant
- choose `dagStats()` when the reader needs structural summary more than local topology
- choose `dagPane()` when the user should actively inspect and navigate the graph

## What this example proves

- ancestor, descendant, and neighborhood slices
- ghost-node boundaries that keep the slice honest about omitted context
- a better alternative than forcing oversized full-graph renderings into the terminal

[← Examples](../README.md)
