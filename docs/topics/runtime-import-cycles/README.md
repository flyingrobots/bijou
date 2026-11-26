# Runtime import cycle ratchet

`npm run code-dojo:cycles` checks the strongly connected components (SCCs) of
the repository's runtime import graph against a checked-in inventory,
`scripts/code-dojo/baselines/runtime-scc.json`. Like the other files in that
directory, the inventory is a ratchet: components may shrink or disappear,
and none may appear or grow. The requirements and their tests are in the
[test plan](./test-plan.md).

## What the graph contains

The command lists the repository's `.ts` and `.tsx` files with
`git ls-files --cached --others --exclude-standard`, so it covers tracked and
untracked files that are not ignored, and skips `.d.ts` declarations. That is
every package, `scripts/`, `tests/`, `examples/`, `bench/` and `fixtures/`,
test files included. A deleted file is not listed.

Edges come from TypeScript's own syntax tree, read from each file's top-level
statements:

| Statement | Edge |
| --- | --- |
| `import { a } from './a.js'`, `import a from`, `import * as a from` | yes |
| `import './a.js'` (side effect) | yes |
| `export { a } from './a.js'`, `export * from`, `export * as a from` | yes |
| `import type { A } from`, or `import { type A, type B } from` | no |
| `export type { A } from`, or `export { type A } from` | no |
| `import {} from './a.js'` (an empty named import) | no |
| `import('./a.js')`, `require('./a.js')`, `import a = require('./a.js')` | no |
| a package name or path alias, such as `@flyingrobots/bijou` | no |

An import that names one value binding and some `type` bindings is an edge.
An import whose value bindings are used only as types is still an edge: the
graph does not look at how a binding is used.

A relative specifier resolves the way the packages build. A `.js`, `.mjs` or
`.cjs` specifier names its `.ts` or `.tsx` source, a directory names its
`index.ts` or `index.tsx`, and a specifier that names a listed source exactly
also resolves. A specifier that matches no listed file gives no edge.

Imports between workspace packages use package names, so a cycle that runs
through two packages is not in this graph.

## What the inventory records

The SCCs are computed with Tarjan's algorithm. The inventory keeps each
component of two or more modules, and each module that imports itself. For
each one it records:

- `id`: the first module in sorted order, which is the component's identity;
- `area`: `packages/<name>` or `examples/<name>`, or else the top-level
  directory of that module;
- `modules`: its members, sorted;
- `edges`: every runtime edge between two of its members, sorted.

Components are sorted by `id`. The file has one line per component, no
timestamps, and the same bytes whatever order the files are read in. Several
cycle paths through one component count as one component. The document schema
is `schemas/code-dojo.runtime-scc-inventory.v1.schema.json`.

## How the ratchet judges a change

Each current component is compared with the baseline components that share a
module with it:

| Current component | Result |
| --- | --- |
| shares no module with any baseline component | `new-component` violation |
| has modules from two or more baseline components | `merged-components` violation |
| lies in one baseline component and adds a module to it | `grown-component` violation |
| has the same or fewer modules but an edge the baseline did not record | `new-edge` violation |
| has a subset of one baseline component's modules and edges | allowed |

A component that splits into smaller ones, loses modules or edges, or
disappears is allowed. The inventory then differs from the tree, so the
check fails with `inventory-stale` until it is written again. The ratchet
tightens with every removal.

A renamed member is a new module, so it reads as growth.

## Commands

| Command | Does |
| --- | --- |
| `npm run code-dojo:cycles` | `--check`: fails on any violation, then on a stale or missing inventory |
| `npm run code-dojo:cycles:write` | `--write`: writes the current inventory, and refuses with `growth-not-accepted` when that would record a violation |
| `npm run code-dojo:cycles:write -- --accept-growth` | writes it anyway; this needs design-review justification, as `AGENTS.md` asks of any grown baseline |

Output is JSON Lines. Each line carries `_schema`
(`code-dojo.runtime-scc-event`, version `1.0.0`) and a `kind`. The schema is
`schemas/code-dojo.runtime-scc-event.v1.schema.json`. `graph-built`,
`inventory-current`, `inventory-written`, `help` and `schema` lines go to
stdout. `violation` and `error` lines go to stderr. `--human` prints prose
instead, `--help` describes the command and prints both schemas, and
`--schema` prints the schemas. Every failure, including an unexpected
exception, is an `error` line with a `code`; a crash of Node itself is not
covered.

## Where it runs

`npm run code-dojo:cycles` is a step of `code-dojo:verify`, which the hosted
Code Dojo workflow runs, and of the local `code-dojo:ci` gate. It is not part
of the Git hooks. On the full tree the analysis reads about 3,100 files and
takes under a second, so the test suite checks only the committed inventory's
schema and consistency and leaves the real-tree comparison to the gate.
