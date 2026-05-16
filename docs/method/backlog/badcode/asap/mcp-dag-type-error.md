# ASAP: Type Mismatch in `bijou-mcp` DAG Tool

## 2026-04-26

### [Severity: Medium] Broken Overload in `dag()` Call
- **Location:** `packages/bijou-mcp/src/tools/dag.ts:35`
- **Symptom:** `error TS2769: No overload matches this call.`
- **Details:**
    - Overload 1 fails because it expects a `SlicedDagSource` (with `ids`, `ghost`, etc.) but receives an array of node objects.
    - Overload 2 fails because `nodeStyle` is passed in the options object, but it is not a known property of `DagOptions`.
- **Impact:** Blocks CI/CD and local pre-commit hooks.
- **Refactor Suggestion:** Verify the intended `dag()` signature in `@flyingrobots/bijou` and align the call site. Either update `DagOptions` to include `nodeStyle` or remove/move the property. Ensure the input data matches one of the expected interface types.
