# `confirm()`

Binary confirmation prompt for decisions that are honestly yes-or-no.

![demo](demo.gif)

## Run

```sh
npx tsx examples/confirm/main.ts
```

## Use this when

- the decision is genuinely binary
- the consequence of yes versus no is clear
- the user does not need to compare multiple options or inspect long supporting detail

## Choose something else when

- choose `modal()` when the decision belongs inside a rich TUI shell with blocked background interaction
- choose `select()` when there are multiple real options
- choose `alert()` or page content when the user needs more explanation before deciding

## What this example proves

- `confirm()` as the honest yes/no prompt
- explicit default-state behavior
- graceful lowering from interactive confirmation to textual yes/no flow

[← Examples](../README.md)
