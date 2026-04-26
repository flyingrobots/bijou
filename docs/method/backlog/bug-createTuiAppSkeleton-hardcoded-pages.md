# BUG: `createTuiAppSkeleton` acts as a hardcoded test harness rather than a generic app starter

## Date
2026-04-26

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
