# Commands Change State, Effects Do Not

## Protected by legends

- [RE — Runtime Engine](../legends/RE-runtime-engine.md)
- [DX — Developer Experience](../legends/DX-developer-experience.md)

Commands are requests for app-owned stateful action. Effects are non-stateful runtime consequences.

Implications:

- input events are not commands
- effects such as sound, telemetry, or announcements should not be treated as state transitions
- a single input may emit multiple commands and multiple effects
- command and effect buffers should stay distinct so the runtime can apply each intentionally
