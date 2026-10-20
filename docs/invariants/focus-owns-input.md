# Focus Owns Input

## Protected by legends

- [HT — Humane Terminal](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md)
- [RE — Runtime Engine](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md)
- [DL — Design Language](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md)

The active thing should own the controls.

Implications:

- inactive panes should not respond to active-pane controls
- shell overlays and modal layers preempt underlying content
- visible focus styling should correspond to real input ownership
- help and footer hints should reflect the active input region
