# Layout Owns Interaction Geometry

The authoritative geometry for interaction comes from retained layout, not from ad hoc handler registration or render-time guessing.

Implications:

- hit testing should use layout rects
- scroll ownership should align with layout-owned viewport geometry
- when layout changes, interaction geometry changes with it
- components should not keep stale global registrations after moving, resizing, hiding, or disabling
