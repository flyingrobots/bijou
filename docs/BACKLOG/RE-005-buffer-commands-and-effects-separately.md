# RE-005 — Buffer Commands and Effects Separately

Legend: [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

## Idea

Make runtime routing emit distinct command and effect buffers rather than assuming one input becomes one immediately-consumed message.

## Why

One input may need to produce:

- multiple stateful commands
- multiple non-stateful effects
- or no outputs at all while still being handled

## Likely scope

- define runtime command and effect buffer contracts
- formalize ordering and batching rules
- define how commands are applied vs how effects are executed
- preserve deterministic testability
