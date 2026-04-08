# Migrating to Bijou 4.2.0

## From 4.1.0

### New package: @flyingrobots/bijou-mcp

`@flyingrobots/bijou-mcp` is a new addition to the workspace. It has no
effect on existing code — it is an MCP stdio server that wraps existing
Bijou components for use in AI chat contexts.

If you use it, install it alongside the core package:

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-mcp
```

### Runtime engine changes (RE-007)

If your app uses `createFramedApp` from `@flyingrobots/bijou-tui`, the
following internal functions were removed:

- `handleFrameMouse`
- `paneHitAtPosition`
- `settingsRowAtPosition`
- `isInsideSettingsDrawer`
- `withObservedKey`
- `applyQuitRequest`
- `observedRouteForLayer`
- `applyHelpScrollAction`

These were internal to the framed shell and not part of the public API.
If you were importing them directly, replace with the runtime engine's
routing infrastructure (`routeRuntimeInput`, `bufferRuntimeRouteResult`,
`applyRuntimeCommandBuffer`).

### Inspector fix

`inspector()` now renders `supportingTextLabel` in interactive mode. If
you were working around its absence (e.g. embedding the label in
`supportingText` manually), you can remove the workaround.

### No breaking changes

This is an additive minor release. All existing public APIs remain
unchanged.
