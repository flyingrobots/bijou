# `spinnerFrame()`

Indeterminate activity feedback when work is real but percent-complete is unknown.

![demo](demo.gif)

## Run

```sh
npx tsx examples/spinner/main.ts
```

## Use this when

- the task is active but indeterminate
- the user needs reassurance that work is still happening
- phase changes matter more than exact completion percentage

## Choose something else when

- choose `progressBar()` when completion can be estimated honestly
- avoid perpetual spinners when a retry, failure, or durable status message is the more honest next state
- avoid using animation where a static snapshot or final result would communicate better

## What this example proves

- animated spinner frames inside a TUI loop
- phase-based messaging that changes from loading to processing to done
- `spinnerFrame()` as the right primitive when activity is real but determinate progress is not

[← Examples](../README.md)
