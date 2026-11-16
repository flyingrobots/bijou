---
title: DL-038 Wesley Version Floor and Invocation Boundary
lane: roadmap
priority: medium
github_issue: 663
status: active
keywords:
  - graphql
  - wesley
  - bijou-block
  - provenance
  - supply-chain
---

# Wesley Version Floor and Invocation Boundary

## Linked Work

- Decision card: [#663](https://github.com/flyingrobots/bijou/issues/663)
- Blocked implementation: [#531](https://github.com/flyingrobots/bijou/issues/531)
- Upstream compiler: [flyingrobots/wesley](https://github.com/flyingrobots/wesley)

## Decision Summary

1. **Version floor.** Bijou targets the Wesley `0.3.0-alpha` line and pins
   `wesley-cli` **exactly** to `0.3.0-alpha.3`. Bijou supports one Wesley
   version at a time. Moving the pin is a normal reviewed change that
   regenerates the golden fixtures. The `0.1.x` line is not supported.
2. **Invocation boundary.** Bijou spawns the stock `wesley` CLI as a separate
   process at build and authoring time. It does not link Wesley into a Node
   process through WASM or napi. The contract is the CLI's JSON output
   (`wesley schema lower --json` and `wesley schema hash --json`) checked against
   Wesley L1 IR `version: "1.0.0"`.
3. **Runtime split.** The `@flyingrobots/bijou` core package stops parsing SDL.
   It gains a pure emitter that turns Wesley L1 IR JSON into `bijou-block/1`.
   The SDL entry point, which spawns Wesley, moves to Node-only code
   (`@flyingrobots/bijou-node` and repository scripts). Core stays free of
   `child_process` and of any native dependency.
4. **Failure.** An absent, wrong-version or contract-breaking Wesley is a hard
   error with a named code. Bijou never falls back to its old TypeScript
   parser, because a fallback would bring back the second extraction that #531
   removes.

## Evidence

Gathered on 2026-11-15 from the public repository, its releases and crates.io.

| Fact | Source |
| --- | --- |
| Wesley is public, Rust, Apache-2.0. | `gh repo view flyingrobots/wesley` |
| Releases: `v0.1.1`, `v0.2.0` (latest stable), `v0.3.0-alpha.1`, `alpha.2`, `alpha.3` (2026-09-20). | `gh release list -R flyingrobots/wesley` |
| Distribution is crates.io only: five crates including `wesley-core` and `wesley-cli`. GitHub Releases carry **no binary assets**. | `RELEASE.md`; `gh release view v0.3.0-alpha.3` |
| Nothing is published to npm (`npm view wesley-core` is 404). The repository `package.json` is `private`. No WASM or napi crate exists. | npm registry; `crates/` listing |
| `0.3.0-alpha.3` changes no compiler source relative to `alpha.2`: IR, hashes and emitted code are identical. | `v0.3.0-alpha.3` release notes |
| From `alpha.2`, published crates pin siblings exactly (`=X.Y.Z`). Pre-releases must be requested by exact version. | Wesley `CHANGELOG.md`, `RELEASE.md` |
| `schema lower`, `schema hash`, `schema diff` all take `--schema <path> --json`. | Wesley `docs/cli.md` |
| L1 IR schema (`schemas/ir.schema.json`) requires `version` with `const "1.0.0"` and `additionalProperties: false`. | Wesley `schemas/` |
| `profunctoroptics/website/packages/page-contract` records `wesley-core 0.3.0-alpha.1`. | #531 |
| Bijou today: `compileGraphqlBijouBlock` in `packages/bijou/src/core/graphql-bijou-block.part02.ts`, exported from core. Its `sourceHash` is `hashUiSceneValue(artifactBody)`, a hash of the *lowered* body, not of the SDL bytes. | Bijou source |

Not established: the `0.1.0` and `0.3.0-alpha.x` CLI output for
`examples/docs/fixtures/graphql/navigation-list.graphql` was not captured,
because no `wesley` binary is installed in this environment. The `alpha.3` run
is the first acceptance check of #531 (see Contracts). No published Wesley
release plan for `0.3.0` stable or `1.0` was found.

## Why this choice

**Version floor.** The `0.3.0-alpha` line is the line the in-anger consumer
uses, and it has the library split (`LoweringPort`) and exact sibling pins.
`alpha.3` has the same compiler as `alpha.2`, so it is the most stable point on
that line. The `0.1.x` CLI predates the work `page-contract` relies on. Two
consumers on two Wesley lines would be two `get`s again, which is the defect
#531 exists to remove. An exact pin makes alpha churn visible: it arrives only
as a reviewed bump with regenerated goldens, never silently.

**Boundary.** Wesley ships as a Rust CLI on crates.io and nothing else. A
process boundary uses that artifact as-is. A binding would make Bijou the owner
of a second Wesley distribution (a WASM or napi build, its toolchain and its
publishing) for a pre-1.0 compiler. Lowering happens when blocks are authored
or built, not on every frame, so process start-up cost does not matter. The
CLI's `--json` output is already the contract `page-contract` and Wesley's own
executable documentation test against.

## Alternatives Rejected

1. **Target the stock `0.1.0` line.** Stable locally, but older than the line
   the only other consumer uses, so the two consumers would lower differently.
   `0.2.0` has the same problem. Rejected.
2. **Range pin (`>=0.3.0-alpha.3 <0.4.0`).** Cargo and semver treat
   pre-releases specially, and Wesley itself moved to exact pins in `alpha.2`
   after caret requirements drifted. A range lets IR or hash changes arrive
   without review. Rejected until Wesley reaches a stable line; see
   Consequences.
3. **WASM package in-process.** One process and no Rust toolchain at install
   time. But Wesley publishes no WASM build. Bijou would have to build, version
   and publish one, and keep it aligned with every Wesley release. A published
   binding is also the part #663 calls costly to reverse. Rejected; revisit if
   Wesley itself publishes a WASM package.
4. **napi native addon.** Same ownership cost as WASM, plus per-platform
   prebuilt binaries and native code in Bijou's npm supply chain. Rejected.
5. **Keep the TypeScript parser as a fallback.** Rejected: two lowerings that
   can disagree undetected (#531 section 2c).

## Consequences

- **Build and CI.** Any job that lowers SDL installs Wesley with
  `cargo install wesley-cli --version =0.3.0-alpha.3 --locked`, cached by
  version. Jobs that only consume committed IR or `bijou-block/1` fixtures do
  not need Rust. Package users who call only the IR emitter do not need Wesley.
- **Supply chain.** No new npm dependency, no native code in the published
  packages. The trust root is the crates.io release at an exact version with
  `--locked`. The `wesley` binary is located from `BIJOU_WESLEY_BIN`, else
  `PATH`, and its `--version` is checked before use.
- **Public API.** `compileGraphqlBijouBlock` moves out of core. This is a
  breaking change for core callers and is recorded in the changelog of the
  release that ships #531.
- **Reversibility.** The pin is one line. The process boundary can later be
  replaced by an in-process binding behind the same IR-emitter API without
  changing callers of the emitter.
- **Moving off alpha.** When Wesley ships a stable `0.3.0` or `1.0`, a follow-up
  may widen the pin to a caret range for that stable line, keeping the
  contract checks below.

## Contracts for #531

1. **Pin.** One constant, `WESLEY_REQUIRED_VERSION = '0.3.0-alpha.3'`, in the
   Node-side adapter, and the same value in CI install steps. A check fails CI
   if they differ.
2. **Invocation.** The adapter runs, with an argument array and no shell:
   `wesley --version`, then `wesley schema lower --schema <path> --json` and
   `wesley schema hash --schema <path> --json`. SDL passed in memory is written
   to a temporary file first. Non-zero exit, a timeout, or stderr with no JSON
   on stdout is a failure; stderr is kept in the error.
3. **Output contract.** `schema lower` stdout parses as JSON with
   `version === "1.0.0"`. Any other IR version is a failure. The emitter reads
   only the fields it needs and ignores unknown optional fields.
4. **Failure codes.** `WESLEY_NOT_FOUND` (binary absent; the message gives the
   `cargo install` command), `WESLEY_VERSION_MISMATCH` (found vs required),
   `WESLEY_IR_VERSION_UNSUPPORTED`, `WESLEY_LOWER_FAILED` (exit status, stderr).
   There is no fallback parser and no "best effort" mode.
5. **Identities.** The artifact replaces the single `sourceHash` with three
   named fields:
   - `sourceDigest` — owner Bijou. `sha256:` of the exact SDL bytes Bijou read,
     computed by Bijou before invoking Wesley.
   - `semanticDigest` — owner Wesley. The value from `wesley schema hash`,
     recorded verbatim with Wesley's algorithm label. Bijou never recomputes it.
   - `compiler` — owner the build. `{ name: "wesley-cli", version }` taken from
     `wesley --version`, plus `emitter: { name: "bijou-block", version }` and
     a digest of the emitter options that affect output.
6. **Golden.** `examples/docs/fixtures/graphql/navigation-list.graphql`
   lowered through `alpha.3` preserves every directive and type fact listed in
   #531, with repeated directives as lists. The captured IR is committed so the
   emitter tests run without Wesley.
7. **Digest separation.** A whitespace-only or comment-only SDL change alters
   `sourceDigest` and leaves `semanticDigest` unchanged.
8. **Pin bump procedure.** Change the constant and CI value, regenerate the
   committed IR and goldens, and review the diff. A changed `semanticDigest`
   for unchanged SDL is called out in the PR.
