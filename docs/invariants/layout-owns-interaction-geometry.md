# Layout Owns Interaction Geometry

## Protected by legends

- [RE — Runtime Engine](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md)
- [DL — Design Language](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md)

The authoritative geometry for interaction comes from retained layout, not from ad hoc handler registration or render-time guessing.

Implications:

- hit testing should use layout rects
- scroll ownership should align with layout-owned viewport geometry
- when layout changes, interaction geometry changes with it
- components should not keep stale global registrations after moving, resizing, hiding, or disabling
