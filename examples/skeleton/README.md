# `skeleton()`

Short-lived placeholders for known-shape loading states.

![demo](demo.gif)

## Run

```sh
npx tsx examples/skeleton/main.ts
```

## Use this when

- the final content shape is already known
- a brief loading gap would otherwise cause distracting layout pop
- the user benefits from seeing where content will appear

## Choose something else when

- choose partial real content once any trustworthy content is available
- choose `spinner()` or `progressBar()` when duration or progress matters more than shape
- avoid long-lived skeletons that start to look like fake content instead of honest loading state

## What this example proves

- single-line and multiline placeholders
- a card-shaped skeleton region inside real containment
- `skeleton()` as a temporary loading affordance, not a permanent blank state

[← Examples](../README.md)
