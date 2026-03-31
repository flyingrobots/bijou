# RE-007 — Migrate Framed Shell Onto Runtime Engine Seams

Legend: [RE — Runtime Engine](/Users/james/git/bijou/docs/legends/RE-runtime-engine.md)

## Idea

Move the current framed shell onto the new runtime-engine seams once the first-class objects exist.

## Why

The shell is where the current architectural debt is most visible:

- derived layer stacks
- branchy mouse routing
- mixed layout and routing concerns
- help/footer/control projection tied to shell-specific branches

## Likely scope

- migrate framed-app layers onto the explicit view stack
- migrate shell routing onto retained layouts
- migrate shell commands/effects onto the new buffers
- use the shell as the proving surface before broader runtime adoption
