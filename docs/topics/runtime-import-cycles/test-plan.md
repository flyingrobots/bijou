# Test plan: runtime import cycle ratchet

This ledger lists each requirement of the
[runtime import cycle ratchet](./README.md), the test that holds it, and its
status. Every test is in `scripts/`, in the file named in the group heading.
The oracle for each case is the assertion in the named test. Fixture trees
are written in the test, in memory or into a temporary Git working tree.

## Graph and components: `code-dojo-runtime-import-graph.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RIC-01 | A 2-cycle and a 3-cycle are one component each; a module that only imports into a cycle is not a member. | `finds a 2-cycle and a 3-cycle as one component each` | Implemented |
| RIC-02 | Disjoint cycles stay apart, sorted by anchor module, with their area. | `keeps two disjoint cycles apart and sorts them by their anchor module` | Implemented |
| RIC-03 | Two cycle paths through one component count once, and every internal edge is recorded. | `counts an SCC with two distinct DFS cycle paths once, recording every internal edge` | Implemented |
| RIC-04 | Re-exports, `export *` and side-effect imports are edges. | `follows runtime re-exports, export-star and side-effect imports` | Implemented |
| RIC-05 | A cycle that exists only through `import type`, `type` specifiers or type-only re-exports is not a cycle. | `does not create an edge for import type, inline type-only specifiers or type-only re-exports` | Implemented |
| RIC-06 | A self-import is a one-module component. | `records a self-import as a one-module component` | Implemented |
| RIC-07 | Dynamic `import()`, package names and unresolved paths give no edge. | `does not create an edge for a dynamic import(), a package name or an unresolved path` | Implemented |
| RIC-08 | Directory specifiers resolve to `index.ts`, and `.tsx` sources resolve. | `resolves directory index modules and .tsx sources` | Implemented |
| RIC-09 | Shuffled file order gives identical inventory bytes. | `serializes identical bytes for any file order` | Implemented |

## Ratchet: `code-dojo-runtime-scc-ratchet.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RIC-10 | An unchanged inventory holds. | `holds when the current inventory equals the baseline` | Implemented |
| RIC-11 | A new component fails as `new-component`. | `fails a new component that shares no module with the baseline` | Implemented |
| RIC-12 | A component that gains a module fails as `grown-component`. | `fails a component that grows by a module` | Implemented |
| RIC-13 | A new internal edge fails as `new-edge`. | `fails a new edge inside an existing component with the same modules` | Implemented |
| RIC-14 | Two components merging fails as `merged-components`. | `fails two baseline components merging into one` | Implemented |
| RIC-15 | Shrinking, splitting and disappearing are not violations. | `allows a component that shrinks, splits or disappears` | Implemented |

## Command: `code-dojo-runtime-scc-cli.test.ts`

Every line each case prints is validated against the event schema.

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RIC-16 | `--write` refuses growth without `--accept-growth`; the written inventory validates; `--check` then holds. | `writes a schema-valid inventory only with --accept-growth, then --check holds` | Implemented |
| RIC-17 | A new cycle and a grown cycle fail with `violation` lines and `ratchet-failed`. | `fails a new cycle and a grown cycle with violation lines` | Implemented |
| RIC-18 | A shrunk or removed cycle fails as `inventory-stale` until written, then passes. | `fails a shrunk or removed cycle as stale until regenerated, then passes` | Implemented |
| RIC-19 | A missing or inconsistent inventory is an error line. | `reports a missing, invalid or inconsistent inventory as an error line` | Implemented |
| RIC-20 | `--help` and `--schema` print JSON Lines, a bad argument is an error line, and `--human` prints prose. | `answers --help and --schema with JSON Lines, and --human with prose` | Implemented |

## Committed inventory: `code-dojo-runtime-scc-inventory.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RIC-21 | The committed inventory validates against its schema. | `validates against its JSON Schema` | Implemented |
| RIC-22 | It is internally consistent and in canonical bytes. | `is internally consistent and in canonical byte form` | Implemented |
| RIC-23 | It names only modules that exist. | `names only modules that exist in the tree` | Implemented |
| RIC-24 | The consistency check finds wrong counts, order, id, area and edges. | `detects an inconsistent inventory` | Implemented |

The test suite does not analyse the real tree. `npm run code-dojo:cycles`
does, as a gate step.

## Wiring: `code-dojo-runtime-scc-wiring.test.ts`

| ID | Requirement | Test | Status |
| --- | --- | --- | --- |
| RIC-25 | `code-dojo:cycles` runs the check. | `exposes the check as code-dojo:cycles` | Implemented |
| RIC-26 | The check is a step of `code-dojo:verify`, which the Code Dojo workflow runs, and of `code-dojo:ci`. | `runs in the hosted Code Dojo lane and the local full gate` | Implemented |
