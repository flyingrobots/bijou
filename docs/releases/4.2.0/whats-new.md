# What's New in Bijou 4.2.0

## MCP Rendering Server

Bijou now ships `@flyingrobots/bijou-mcp`, an MCP (Model Context
Protocol) server that exposes Bijou's terminal components as rendering
tools over stdio.

Any MCP client — Claude Code, Cursor, or a custom integration — can
call 22 tools to get Unicode box-drawing output that renders correctly
in monospace chat contexts. Tables, trees, DAGs, alert boxes, progress
bars, timelines, and more — all produced without ANSI escape codes.

### Why this matters

LLM-powered coding tools talk in plain text. Structured terminal output
(tables, graphs, trees) is useful in that context, but the rendering
usually lives on the other side of a TTY. bijou-mcp bridges that gap:
the AI calls a tool, Bijou renders the component, and the result drops
into the conversation as clean Unicode text.

### Highlights

- **22 rendering tools** covering data/structure, containers/layout,
  feedback/status, navigation, rich panels, and utility categories
- **No ANSI** — uses `createTestContext` with `plainStyle()` for
  terminal-free rendering
- **Zero config** — point your MCP client at the bin entrypoint and go

See the
[bijou-mcp README](../../packages/bijou-mcp/README.md) for the full
tool inventory and configuration instructions.

## Runtime Engine: Framed Shell Migration (RE-007)

The framed shell now routes all input through the runtime engine's
`routeRuntimeInput` infrastructure instead of ad-hoc key/mouse
branches.

### What changed

- Key routing flows through `routeRuntimeInput` producing
  `FrameShellCommand` facts
- Mouse hit-testing uses retained layout trees with explicit layout
  nodes (`tab:{pageId}`, `pane:{paneId}`, `settings-row:{index}`)
- Commands are buffered via `bufferRuntimeRouteResult` and applied via
  `applyRuntimeCommandBuffer`
- Shell commands are a plain discriminated union interpreted by a handler
  table, not classes with behavior
- The `update()` key and mouse branches are reduced to single-line
  buffer drains

### What was removed

- `handleFrameMouse`
- `paneHitAtPosition`
- `settingsRowAtPosition`
- `isInsideSettingsDrawer`
- `withObservedKey`
- `applyQuitRequest`
- `observedRouteForLayer`
- `applyHelpScrollAction`

These functions were replaced by the runtime engine's routing and buffer
infrastructure. The migration is captured in
[RE-007](../../docs/design/RE-007-migrate-framed-shell-onto-runtime-engine-seams.md).

## Bug Fixes

- **Inspector `supportingTextLabel`** now renders in interactive mode.
  Pipe and accessible modes already included it; interactive was
  silently dropping the label.
- **Explainability evidence values** now render through the MCP wrapper.
  Evidence items display as "label — value" instead of label-only.

## Infrastructure

- All release infrastructure (publish workflow, dry-run workflow, pack
  verification, npm verify checks) now includes `@flyingrobots/bijou-mcp`.
- The repo's planning system has been migrated to METHOD with all 7
  legends resolving correctly.

## Package Map

This release adds one new package to the lock-step family:

| Package | Role |
| --- | --- |
| `@flyingrobots/bijou-mcp` | MCP server: Bijou rendering tools for AI chat contexts |

All 10 workspace packages are versioned together at `4.2.0`.
