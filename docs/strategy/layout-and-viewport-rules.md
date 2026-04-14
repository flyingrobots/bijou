# Layout And Viewport Rules

_Strategy note for Bijou's canonical layout ownership and overflow behavior_

## Why this exists

Bijou already has strong layout instincts, but too many of them have lived as
local bug fixes or component folklore.

This note turns those instincts into explicit rules:

- who owns whitespace
- when a child fills versus centers within a parent
- what resize is allowed to change
- when overflow becomes a viewport instead of a paint trick
- how scrollbars, focus, hit-testing, and scrolling must stay aligned

Read this alongside
[layout localization pipeline](./layout-localization-pipeline.md). That note
explains how a `LayoutNode` tree becomes a local paint root; this one explains
the user-facing layout and overflow rules that tree should obey.

## Rule 1: Parents own placement, children own content

A child surface or layout node owns its own content. A parent owns where that
child sits inside available space.

That means:

- children do not silently self-center inside a larger parent rect
- children do not invent extra outer padding unless the component contract says
  they do
- parents decide stack order, alignment, and unused slack

If a surface appears "floating" inside a larger region, that should be because
the parent layout expressed that intention explicitly.

## Rule 2: Slack is a layout decision, not an accident

Unused width or height must be explainable.

Legitimate causes:

- the parent intentionally centers or aligns a child
- the parent reserves gutter, rail, or chrome space
- the child is intrinsically smaller and the parent deliberately does not fill

Illegitimate causes:

- a child paints less than the geometry routing thinks it owns
- a container leaves dead area because no rule says who should fill it
- a scrollbar or overlay rail steals width without owning that contraction

If there is visible slack, someone should clearly own it.

## Rule 3: Resize changes geometry, not semantics

Terminal resize may change:

- split ratios translated into actual rect widths/heights
- grid track sizes
- wrapping points
- viewport capacity

Resize must not silently change:

- focus ownership
- which node conceptually owns a region
- whether content is now "different" instead of merely reflowed

When a resize forces a more compact rendering, the semantic structure should
stay the same even if line breaks, truncation, or viewport extent change.

## Rule 4: Overflow belongs to a viewport

Overflow is not just "paint past the edge and hope clipping works."

If content needs to move independently of its container, that region should be
owned by a viewport or another explicit scroll-capable primitive.

Use a viewport when:

- keyboard navigation needs a stable scroll state
- mouse wheel input should move content
- a scrollbar is shown
- clipping and visible extent are part of the contract

Do not fake viewport behavior by:

- clipping a child while storing scroll state somewhere unrelated
- painting a scrollbar for content that has no canonical scroll owner
- letting hit-testing or focus believe content is visible when the viewport has
  clipped it away

## Rule 5: Scrollbars are promises, not decoration

If a scrollbar is visible, it promises:

- there is a real scroll owner
- the thumb reflects actual visible extent
- keyboard and mouse scrolling target that same owner
- hit-testing and focus use the same geometry the rail implies

A scrollbar must never be merely a painted affordance with separate hidden
scroll truth elsewhere.

## Rule 6: Layout geometry drives interaction geometry

Pointer hit-testing, wheel routing, focus movement, and scroll targeting should
reuse the same retained geometry that layout/render already established.

That means:

- input routing should not rebuild a different mental model of the workspace
- scroll regions should not guess where panes are from visual pixels alone
- retained layout caches are legitimate when they preserve layout truth

This rule is the bridge between the design-language posture here and the
runtime invariant [Layout Owns Interaction Geometry](../invariants/layout-owns-interaction-geometry.md).

## Rule 7: Wrap, clip, and viewport are distinct choices

Overflow handling should be explicit:

- **wrap** when the content should remain fully readable inside flowing text
- **clip** when the content is intentionally bounded and off-edge detail is not
  currently navigable
- **viewport** when the content remains conceptually larger than its visible
  window and users need to move through it

Do not blur these:

- clipping is not scrolling
- wrapping is not resizing the model
- viewporting is not just clipping plus a painted thumb

## Rule 8: Shell chrome must not lie about owned width

Headers, footers, gutters, split dividers, notification rails, and scrollbar
overlays all participate in layout ownership. They must either:

- consume width/height explicitly, or
- overlay without changing the body's owned geometry

The body region should never be measured as if chrome were absent and then
painted as if chrome had stolen width after the fact.

## Practical consequences

When touching layout code, ask:

1. Who owns this whitespace?
2. If content overflows, where does scroll state live?
3. If a scrollbar is visible, which viewport does it speak for?
4. Does input routing use the same geometry that render used?
5. Would a resize reflow the same semantic layout, or accidentally change it?

If those answers are not explicit, the layout contract is still too vague.

## Read this with

- [layout localization pipeline](./layout-localization-pipeline.md)
- [Layout Owns Interaction Geometry](../invariants/layout-owns-interaction-geometry.md)
- [packages/bijou-tui/ARCHITECTURE.md](../../packages/bijou-tui/ARCHITECTURE.md)
- [docs/design-system/patterns.md](../design-system/patterns.md)
