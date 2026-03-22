# `stepper()`

Step progress indicators

![demo](demo.gif)

## Run

```sh
npx tsx examples/stepper/main.ts
```

## Use this when

- the user is moving through ordered stages
- progress through a process matters more than peer switching
- the current stage and remaining path should be visible at a glance

## Choose something else when

- choose `tabs()` when the views are peers
- choose `breadcrumb()` when the user needs path context rather than process progress
- choose `paginator()` when compact position feedback is enough and process semantics would overstate the flow

## What this example proves

- `stepper()` as a staged-process indicator
- early, middle, and completed-state snapshots
- process progress that still lowers honestly into text output

[← Examples](../README.md)
