# `progressBar()`

Determinate progress bars for work with an honest completion estimate.

![demo](demo.gif)

## Run

```sh
npx tsx examples/progress-static/main.ts
```

## Use this when

- completion can be estimated honestly
- the user benefits from knowing how far through a task they are
- a static snapshot of progress is enough for the output mode

## Choose something else when

- choose `spinnerFrame()` or `createSpinner()` when the task is active but indeterminate
- avoid fake percentages when the system does not actually know progress
- avoid progress bars for trivial work that starts and finishes too quickly to matter

## What this example proves

- determinate bars across several completion states
- width control for compact or wide progress regions
- `progressBar()` as the honest choice when percent-complete is known

[← Examples](../README.md)
