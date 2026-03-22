# `dag()`

Passive dependency and causal-flow graph rendering.

![demo](demo.gif)

## Run

```sh
npx tsx examples/dag/main.ts
```

## Use this when

- dependency or causal flow is the actual structure
- multiple parents or merges matter
- the reader needs to answer questions like “what depends on this?” or “what does this unblock?”

## Choose something else when

- choose `tree()` for simple parent/child hierarchy
- choose `timeline()` when order is the story and dependency is not
- choose `table()` when the job is comparing attributes, not tracing flow
- avoid DAGs that become architecture wallpaper instead of supporting a concrete task

## What this example proves

- full-graph rendering with badges and status tokens
- highlighted critical path rendering
- `dag()` as passive explanation, not interactive inspection

For focused subgraphs, see [`dag-fragment`](../dag-fragment/). For metrics and graph health, see [`dag-stats`](../dag-stats/). For keyboard inspection, see [`dag-pane`](../dag-pane/).

[← Examples](../README.md)
