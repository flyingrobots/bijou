# DX-032 Create TUI app skeleton renders consumer pages

Legend: [DX - Developer Experience](../legends/DX-developer-experience.md)

## Date
2026-04-26

## Sponsor human

A Bijou app author using the batteries-included TUI skeleton to compose a
real application from first-party or community blocks.

## Sponsor agent

An agent scaffolding a Bijou app that must bind page content into a framed
shell without dropping down to lower-level `createFramedApp()` wiring.

## Hill

`createTuiAppSkeleton()` can host consumer-provided page content while keeping
the stock header, footer, command palette, drawer, and quit-confirm shell
behavior.

## Location
`packages/bijou-tui-app/src/index.ts`

## Description
The `createTuiAppSkeleton` function in `@flyingrobots/bijou-tui-app` is named and documented as a "batteries-included design-system shell starter". However, its internal implementation behaves more like a hardcoded test harness for the framework's own internal documentation (e.g., the `DOGFOOD` app).

The `SkeletonTab` interface only accepts an `id` and a `title`:
```typescript
export interface SkeletonTab {
  readonly id: string;
  readonly title: string;
}
```

Because it does not accept a `render` function or a generic `FramePage` spec, the skeleton completely ignores any custom UI blocks a consumer tries to render within the tabs. The internal engine statically maps the tabs to pre-defined layout configurations (like the "Split" or "Drawer" pages) and throws away any external layout logic, resulting in empty or generic screens for consumers who try to use it as a real application starter.

## Impact
- **Developer Experience (DX):** New users attempting to use `@flyingrobots/bijou-tui-app` to scaffold their own applications will encounter "empty apps" and assume their layout code is broken.
- **Architectural Confusion:** It forces consumers to abandon the package entirely and drop down to the lower-level `createFramedApp` in `@flyingrobots/bijou-tui` to regain control over their own rendering pipeline.

## Recommended Fix
1. **Option A (Rename/Deprecate):** Rename the function to `createTestHarnessSkeleton` or clearly document that it is strictly for internal framework testing/dogfooding, not for general consumer use.
2. **Option B (Make it Generic):** Update the `SkeletonTab` interface to accept a `render` function or `layout` node generator, allowing consumers to inject their own Bijou components (`Surface` or `LayoutNode`) into the shell's body region while still benefiting from the skeleton's built-in header, footer, and modal orchestration.

## Decision

Choose Option B.

`SkeletonTab` should accept:

- `render(width, height, context)` for single-pane content
- `layout(context)` for full frame layout topology

Tabs without either option keep the existing default showcase behavior. Tabs
with consumer content are treated as custom pages and do not inherit the demo
drawer or split layout by index.

## Playback questions

1. Can a custom tab render a consumer `Surface` inside the stock shell body?
2. Can a custom tab provide a full `FrameLayoutNode` for splits or grids?
3. Does the default two-tab demo still render drawer and split pages?
4. Does the skeleton reject ambiguous tabs that define both `render` and
   `layout`?

## Accessibility / assistive reading posture

No new accessibility surface is added in this slice. The important behavior is
that consumer content enters the existing frame/layout/focus machinery instead
of being bypassed or replaced by demo pages.

## Localization / directionality posture

No new localization behavior. Consumer content remains owned by the consumer
renderer or layout factory.

## Agent inspectability / explainability posture

The public `SkeletonTab` contract makes page ownership inspectable from the
app declaration. The skeleton shell no longer hides consumer intent behind
index-based demo page selection.

## Implementation outline

1. Extend `SkeletonTab` with optional `render` and `layout` hooks.
2. Reject tabs that define both hooks.
3. Treat hook-backed tabs as custom pages instead of default demo pages.
4. Add focused tests for custom render, custom layout, default behavior, and
   ambiguous tab rejection.

## Tests

- `packages/bijou-tui-app/src/index.test.ts`

## Retrospective

Closed by adding render/layout hooks to `SkeletonTab` and proving that custom
tabs render inside the stock shell without losing existing default skeleton
behavior.
