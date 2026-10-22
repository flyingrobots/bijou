# Replaying the V8 product witnesses

This is an operating procedure for [#541](https://github.com/flyingrobots/bijou/issues/541),
supporting the final release closeout in [#527](https://github.com/flyingrobots/bijou/issues/527).
The historical RC packet and its inherited evidence remain unchanged in the book corpus.

## Run from an exact checkout

Use a clean repository checkout, including untracked files, with the supported
Node toolchain. Install the committed lockfile, then replay:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run --silent release:witnesses > /tmp/bijou-product-witnesses.json
```

Retain the JSON only when the command exits zero. Logs go to stderr; stdout
contains the receipt only after every check succeeds. Keep output outside the
checkout so the output file itself does not make the source dirty.

The command checks nine pinned input/generated files, forces a fresh TypeScript
build, verifies the four generated Profunctor artifacts, and runs the DX-050,
DX-049, and RE-036 test families serially with at most two test workers. Each
child command has a three-minute timeout and bounded captured output. The source
checkout, HEAD, lockfile, and pinned files are checked again before a receipt is
emitted. Use the shared host's resource guard when applicable.

## What the witnesses establish

| Family | Canonical input | Expected observation |
| --- | --- | --- |
| DX-050 | `fixtures/profunctor-page/project-keep/input/` | Pinned website family; deterministic scene, map, receipt and terminal text; injective identities, inspection facts and fail-closed unsupported input |
| DX-049 | `examples/docs/fixtures/graphql/navigation-list.graphql` | GraphQL/block/scene/debug/replay hashes agree; whitespace-only edits preserve semantic hashes; invalid identities and contradictory artifacts fail |
| RE-036 | `tests/fixtures/RE-036/packed-bijou-cells.v1.json` | Validated bytes and side-table order survive Surface adaptation; malformed dimensions, glyphs, colors, scene and focus facts fail before adaptation |

The fixture SHA-256 pins and returned file inventory live in
[`release-product-witness-files.ts`](../../../scripts/release-product-witness-files.ts).
The website provenance is retained in
[`fixtures/profunctor-page/project-keep/README.md`](../../../fixtures/profunctor-page/project-keep/README.md).
Expected product observations remain assertions in the existing tests; the replay
does not replace them with new snapshots. Generated-artifact comparison is byte
exact, with no normalization. Runtime duration, wall-clock date, absolute checkout
path, PID and console formatting are excluded from the JSON receipt. The receipt
does include the actual Node version, so toolchain differences remain visible.

## Final stable closeout

A successful candidate receipt proves these witnesses for its `sourceCommit`.
It does not assert a stable tag, dependency audit result, accessibility review,
or completion of the remaining documentation review in #527. Run the same command
from the eventual stable release commit, verify that the receipt's commit equals
the tag target, and retain that receipt with the fresh release packet before
claiming the inherited rows are verified there. A candidate receipt cannot be
relabeled as evidence for a later commit.

If a fixture or expected generated artifact changes intentionally, review its
provenance and update the pin in the same coherent change. Do not regenerate pins
merely to make an unexpected mismatch pass.
