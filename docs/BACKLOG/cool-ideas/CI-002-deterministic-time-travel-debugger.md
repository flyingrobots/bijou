# CI-002 — Deterministic Time-Travel Debugger

Legend: [DX — Developer Experience](../../legends/DX-developer-experience.md)

## Idea

The TUI runtime loop in `@flyingrobots/bijou-tui` is deterministic. It takes a message, a model, and returns a new model and commands. This means we can record every `Msg` that flows through the system.

Add a "Replay" mode to the runtime and the `createFramedApp()` shell. When enabled, it records all inputs and allows the user (or an agent) to pause the app, scrub backwards through frames, and step forward one message at a time. The current model and view output can be inspected for every step.

## Why

1. **Bug Repro**: A user can send a "repro log" that a builder can load and scrub through.
2. **Determinism Proof**: It proves the "Runtime Truth Wins" invariant by showing that the app's state is a pure function of its history.
3. **Agent Synergy**: AI agents can "debug" a TUI by replaying the messages that led to an error state.

## Effort

Medium-Large — requires an event-logger and a way to re-drive the `update()` function from a log.
