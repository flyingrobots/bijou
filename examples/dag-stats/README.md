# `dagStats()`

Graph health and structural metrics for DAG data.

![demo](demo.gif)

## Run

```sh
npx tsx examples/dag-stats/main.ts
```

## Use this when

- the reader needs graph health, breadth, depth, or duplication signals
- summary metrics matter more than visual shape
- you want to validate or compare DAG structures before rendering the whole graph

## Choose something else when

- choose `dag()` when dependency shape itself is the product
- choose `dagSlice()` when only one local neighborhood matters
- choose `dagPane()` when the user should actively inspect and navigate nodes

## What this example proves

- structural metrics such as nodes, edges, depth, width, roots, and leaves
- pairing DAG metrics with a passive graph render
- using summary and validation signals before escalating to a richer graph viewer

[← Examples](../README.md)
