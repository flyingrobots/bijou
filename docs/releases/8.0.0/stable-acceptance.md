# Bijou 8.0.0 stable acceptance

This is the live acceptance packet for [#527](https://github.com/flyingrobots/bijou/issues/527).
**Stage: preparation; final acceptance requires human release review and exact-merge replay.**
Workspace version `8.0.0` does not assert a published tag or npm release.
GitHub [milestone scope](https://github.com/flyingrobots/bijou/milestone/6)
remains authoritative. The historical RC packet is preserved as R261 in the
book corpus; this packet does not rewrite its inherited evidence or dates.

## Exact candidate evidence

The following observations belong to clean source commit
`f1d1ebc928b360d84d9f2af29b7ce7075b808c5c`, version `8.0.0`, Node `v24.18.0`:

- [Product witness receipt](./stable-candidate-product-witnesses.json): all nine
  pinned files and all five replay steps passed.
- [Runtime dependency audit](./stable-candidate-runtime-audit.json): zero
  reported vulnerabilities, including zero high and critical findings.
- [Validation receipt](./stable-candidate-validation.json): all fifteen
  `release:readiness` steps passed, including 4,282 tests in 957 files,
  frame checks, localization gates, interactive examples, packed canaries,
  and both DOGFOOD smoke routes.

These are candidate receipts. Later documentation commits and the eventual
merge commit have different identities and require their own replay. The
product receipt covers only the three product families below; it does not
stand in for the dependency audit, documentation review, or milestone state.

## Five inherited rows

Every row below was executed on the named candidate. Final stable-commit
verification remains pending until the same checks pass on the exact merge
commit selected for release. No candidate receipt may be relabeled.

| Family | Candidate observation | Canonical input and expected result | Replay |
| :--- | :--- | :--- | :--- |
| DX-050 | Verified here on the candidate | `fixtures/profunctor-page/project-keep/input/` and pinned generated artifacts; byte-exact regeneration, deterministic scene/map/receipt/text, and fail-closed unsupported input | `npm run --silent release:witnesses` |
| DX-049 | Verified here on the candidate | `examples/docs/fixtures/graphql/navigation-list.graphql`; matching GraphQL/block/scene/debug/replay hashes, stable semantic hashes for whitespace edits, rejected contradictory artifacts | Same product replay; runs `tests/cycles/DX-049` separately |
| RE-036 | Verified here on the candidate | `tests/fixtures/RE-036/packed-bijou-cells.v1.json`; validated bytes and side tables survive Surface adaptation; malformed dimensions, glyphs, colors, scene and focus facts fail | Same product replay; runs `tests/cycles/RE-036` separately |
| WF-166 | Verified here on the candidate | Committed workspace manifests and `package-lock.json`; dependency-floor regressions pass, fresh runtime audit has zero high/critical findings | `npm run test:run -- tests/cycles/WF-166`; `npm audit --omit=dev --audit-level=high --json` |
| WF-167 | Verified here on the candidate | Current tracker policy and preserved design corpus; executable authority contract passes | `npm run test:run -- tests/cycles/WF-167` |

The WF regressions ran in the full suite. Their focused commands above allow
independent replay. The nine SHA-256 pins are in
[`release-product-witness-files.ts`](../../../scripts/release-product-witness-files.ts)
and the product receipt. See the [replay procedure](./product-witness-replay.md)
for the complete contract.

Generated artifacts receive no normalization. Test timings, console ordering,
temporary paths, process IDs and wall-clock timestamps are not acceptance
assertions. The product receipt retains the actual Node version and commit.
Audit acceptance compares vulnerability severity counts, not registry response
formatting or a promise about future advisories. No physical-terminal visual
inspection is claimed by the automated results.

## Current architecture and DOGFOOD posture

The pure core retains its ports-and-adapters boundary. Profunctor Page and
VISOR consume explicit artifacts; packed-cell adaptation validates boundary
facts before constructing a Surface. These proofs do not establish a general
browser engine or an external native renderer.

Raster font geometry belongs to `@flyingrobots/bijou-tui`. Font-file decoding
and Google downloads belong to the Markdown example adapter; the library
consumes validated immutable coverage. Essential text and mode selection stay
with the enclosing component. Raster artwork is not its accessible transcript.
Code-point layout does not perform shaping, bidi or kerning.

DOGFOOD uses bundled Jacquard 12 title geometry and a Space Grotesk prompt.
Its book-matched themes are application defaults, independent of library
presets. Current Release Story follows the running release line in all four
supported locales. The live Latest Features and MCP guides describe current
behavior; archive-backed articles retain their historical labels. Existing
font and book-theme captures retain their original source coordinates.

The twelve remaining Code Dojo file/context exceptions were removed through
module extraction with public entrypoints preserved. The aggregate ceiling is
now zero. This does not mean localization debt is zero: the candidate retained
the existing 2,289 raw-string and 78 missing-Markdown baselines. The localization
ratchets passed; this preparation adds no DOGFOOD TypeScript copy. Ongoing
localization work remains in the tracker, including
[#206](https://github.com/flyingrobots/bijou/issues/206).

## Documentation review disposition

The dispositions below are the preparation snapshot, **not human signoff**.
The Release Law's human prose review must be recorded before a stable tag.
The release PR's later maintainer disposition and exact-merge receipt supersede
this snapshot's pending statuses; they do not change the candidate receipts.

| Surface | Agent preparation | Human disposition |
| :--- | :--- | :--- |
| Root README | Current release framing, API ownership, verification commands and live packet link updated | Pending |
| Changelog | Dated stable preparation boundary; history and RC entry retained | Pending |
| Architecture | Archived R4/R5 assessed; current rendering/package addendum above; frozen sources unchanged | Pending |
| VISION | Archived R1 read in full; no rewrite of its historical claims; current package boundaries and explicit limitations recorded here | Pending |
| BEARING / METHOD / ROADMAP | Retired mirrors are not recreated. R261's tracker transition supersedes their review with GitHub scope and current AGENTS/standards | Pending |
| DOGFOOD | Archived R40 assessed; current live guides, release story and automated landing/docs smoke evidence reviewed | Pending |
| Package READMEs | All ten read; core override types and Node startup example corrected | Pending |
| API / migration / design-system references | Theme and detection declarations checked; live core guide corrected; historical references retain original scope; design-system preflight passed | Pending |
| Release evidence and residuals | Candidate receipts retained with exact source; final workflow, current-head review and final merge replay remain required | Pending |

No human approval is inferred from green CI, an agent review, or a historical
review. Record the maintainer's concrete disposition on this packet in the
release PR before claiming that gate complete.

## Replay and final acceptance

From a clean exact checkout, install the committed lockfile, then keep receipts
outside the repository:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run --silent release:witnesses > /tmp/bijou-product-witnesses.json
npm audit --omit=dev --audit-level=high --json > /tmp/bijou-runtime-audit.json
npm run code-dojo:verify
npm run release:readiness
```

On this shared workstation, tests and builds run in the guarded reusable Docker
worker under the repository's resource and coordination agreements. The recorded
candidate used two CPUs, a 3 GiB memory/swap limit, read-only root, bounded tmpfs
outputs and a fail-closed monitor. A written budget alone is not enforcement.

Before final acceptance: finish the review disposition above; run the normal
push/CI and Release Dry Run workflow on the reviewed head; obtain the required
current-head Code Lawyer and independent review; merge normally; then replay
on clean `main` exactly matching `origin/main`. Check live target and earlier
milestones, open PRs and release-blocking issues. Run
`npm run release:readiness -- --milestone v8.0.0` only when the live milestone
has no open items. Retain the final commit-bound receipt in the release PR or
[#527](https://github.com/flyingrobots/bijou/issues/527), with the exact source
commit and commands. Tagging and registry publication are separate operations.
