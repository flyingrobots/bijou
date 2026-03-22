# `note()`

Display-only supporting text for form flows and guided CLI sequences.

## Run

```sh
npx tsx examples/note/main.ts
```

## Use this when

- the user needs explanation without urgency
- the content belongs inside a form, wizard, or guided flow
- the message should support the next step without interrupting it

## Choose something else when

- choose `badge()` for compact inline status
- choose `alert()` when the message deserves its own in-flow status block
- choose notifications or overlays when the content must interrupt or persist as event messaging

## What this example proves

- `note()` as explanatory support, not status escalation
- optional titled and untitled note variants
- graceful lowering into plain textual guidance in non-interactive modes

[← Examples](../README.md)
