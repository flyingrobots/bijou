# `progressBar()` + `spinnerFrame()`

Mixed determinate and indeterminate progress for multi-item work.

![demo](demo.gif)

## Run

```sh
npx tsx examples/progress-download/main.ts
```

## Use this when

- some parts of the workload can report real percentage progress while others are only “in progress”
- the user needs both per-item and overall progress feedback
- a richer operational view is more honest than one global spinner or one global percentage

## Choose something else when

- choose a single `progressBar()` when the work is one determinate stream
- choose a single spinner when all you can say is that work is active
- avoid over-instrumenting small tasks with multiple indicators that add more noise than clarity

## What this example proves

- per-item indeterminate activity and determinate per-item bars
- an aggregated overall progress bar
- mixing spinners and progress bars honestly instead of forcing one model onto every subtask

[← Examples](../README.md)
