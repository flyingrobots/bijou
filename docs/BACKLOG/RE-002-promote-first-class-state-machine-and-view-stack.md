# RE-002 — Promote First-Class State Machine and View Stack

Legend: [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

## Idea

Make application state machines and view stacks first-class runtime objects instead of treating views as thin shell branches or deriving stacks from booleans.

## Why

The runtime needs explicit ownership of:

- durable state transitions
- pushed/popped view layers
- view blocking semantics
- lifecycle rules for clearing or replacing view stacks on state transitions

## Likely scope

- introduce explicit runtime state-machine and view-stack types
- define push/pop/replace semantics
- define what the non-dismissible base workspace/root view looks like
- identify compatibility seams for existing framed-app state
