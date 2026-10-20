# Commands Change State, Effects Do Not

## Protected by legends

- [RE — Runtime Engine](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md)
- [DX — Developer Experience](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md)

Commands are requests for app-owned stateful action. Effects are non-stateful runtime consequences.

Implications:

- input events are not commands
- effects such as sound, telemetry, or announcements should not be treated as state transitions
- a single input may emit multiple commands and multiple effects
- command and effect buffers should stay distinct so the runtime can apply each intentionally
