# ASAP-001 — Fix MCP DAG Type Error

_Cycle for fixing the broken overload in `@flyingrobots/bijou-mcp`'s DAG tool and aligning with the core `dag()` signature._

Legend:
- [RE — Runtime Engine](../../legends/RE-runtime-engine.md)
- [HT — Humane Terminal](../../legends/HT-humane-terminal.md)

## Why this cycle exists

The `bijou-mcp` package is currently broken because the `dag()` tool call in `packages/bijou-mcp/src/tools/dag.ts` does not match the available overloads in `@flyingrobots/bijou`. This blocks CI and local pre-commit hooks, and prevents agents (like BigBro) from using the DAG visualization tool for cycle tracking.

## Human users / jobs / hills

### Primary human users
- framework maintainers
- developers using the MCP server

### Human jobs
1. Visualize graph structures (like the current work cycle) using the MCP tool.
2. Maintain a green build state.

### Human hill
A user can invoke the `bijou_dag` MCP tool and receive a correctly rendered box-drawn graph without encountering type errors during build.

## Agent users / jobs / hills

### Primary agent users
- EXPERT Bijou BigBro (mentorship and auditing)
- any agent using the MCP server for visualization

### Agent jobs
1. Programmatically generate cycle visualizations to communicate progress.

### Agent hill
An agent can use the `dag` component through the MCP interface to provide structured, high-signal progress reports.

## Linked invariants
- [Tests Are the Spec](../../invariants/tests-are-the-spec.md)
- [Schemas Live At Boundaries](../../invariants/schemas-live-at-boundaries.md)

## Test Plan

### Golden Path
- Fix the type error in `packages/bijou-mcp/src/tools/dag.ts`.
- Run `npm run lint` and ensure it passes for `@flyingrobots/bijou-mcp`.
- Verify the `dag()` call correctly passes an array of `DagNode` and valid `DagOptions`.

### Edge Cases
- Pass a `SlicedDagSource` to verify the second overload works.
- Ensure `nodeStyle` is correctly recognized or removed if it was a hallucination in the MCP tool. (Research shows `nodeStyle` exists in `DagOptions` in core).

### Known Failure Modes
- `nodeStyle` might be missing if the `@flyingrobots/bijou-mcp` package is linked to an older version of core or if there's a name collision.

## Implementation Outline
1. Research the exact signature of `dag()` in `packages/bijou/src/core/components/dag.ts`.
2. Inspect `packages/bijou-mcp/src/tools/dag.ts` to identify the mismatched call.
3. Fix the call site:
   - Ensure the input is a valid `DagNode[]` or `SlicedDagSource`.
   - Ensure `DagOptions` only contains valid properties.
4. Verify via `npm run lint --workspace @flyingrobots/bijou-mcp`.

## Retrospective

What landed:
- (TBD)

What did not land:
- (TBD)

Follow-on:
- (TBD)
