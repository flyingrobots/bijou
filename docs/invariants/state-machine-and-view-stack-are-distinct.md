# State Machine and View Stack Are Distinct

## Protected by legends

- [RE — Runtime Engine](../legends/RE-runtime-engine.md)

Application state and visible views are related, but they do not mean the same thing.

Implications:

- a state may outlive a particular view or layer
- a view may persist while underlying state changes
- state transitions may replace or clear the active view stack
- view-stack operations should not be used as a synonym for application-state transitions
