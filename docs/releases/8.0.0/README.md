# Bijou 8.0.0 Release Evidence

**Line status: open.** This packet covers the `8.0.0` release line and is opened
by its first tag, `v8.0.0-rc.1`. The stable `8.0.0` tag completes it rather than
starting a new one — which is why the residual-risk section below reads as a
to-do list rather than a closure record.

Bijou `8.0.0-rc.1` is a **release candidate**, not a stable release. It exists so
downstream consumers can validate two breaking changes — the `NO_COLOR` detection
change and the status-fallback change from
[`DX-052`](../../design/DX-052-no-color-is-not-a-capability.md) — against real
applications before the stable `8.0.0` tag is cut.

## How to read this packet

This packet is deliberately explicit about the difference between evidence
gathered first-hand during release prep and evidence inherited from the cycles
that landed on `main` before it.

- **Verified here** means the command in the "replay" column was run on this
  release-prep branch and its result observed.
- **Inherited** means the goalpost landed through its own reviewed PR with its
  own CI, and this packet cites that lineage without re-running the goalpost's
  specific witnesses.

Every `Inherited` row is a **release-law gap that must be closed before the
stable `8.0.0` tag**. `docs/release.md` requires that a second operator can
replay each witness from the tag commit, and an inherited citation does not meet
that bar. Naming the gap is the honest disposition for a prerelease; carrying it
into a GA tag would not be.

## Release Summary

- Version: `8.0.0-rc.1`
- Previous public tag: `v7.2.0`
- Release type: **prerelease** (release candidate)
- Intended npm dist-tag: `rc` — **not** `latest`
- Release-prep branch: `release/v8.0.0-rc.1`
- Release date: 2026-08-21
- Publish surface: npm workspace packages only, lock-step at `8.0.0-rc.1`
- Target milestone: `v8.0.0` (0 open / 7 closed at prep time)

## Tracker And Goalpost Map

Twenty changelog entries accumulated on `main` since `7.2.0`. They group into
four substantive goalposts, two workflow closeouts, and a maintenance band.

### DX-052 — NO_COLOR is not a capability signal

- Tracker: [#518](https://github.com/flyingrobots/bijou/issues/518) (closed)
- Design: [`DX-052`](../../design/DX-052-no-color-is-not-a-capability.md)
- PR: [#522](https://github.com/flyingrobots/bijou/pull/522)
- Slices: 3 — `detectOutputMode` branch removal, `status()`/`inkStatus()`
  fallback move, `extendTheme()` group coverage
- Deterministic proof: `packages/bijou/src/core/detect/tty.test.ts`,
  `tty.fuzz.test.ts`, `core/environment.part01.test.ts`,
  `core/theme/accessors.test.ts`, `core/theme/extend.test.ts`,
  `core/theme/resolve.part02.test.ts`, `factory.test.ts`
- Replay: `npx vitest run packages/bijou/src/core/detect packages/bijou/src/core/theme packages/bijou/src/factory.test.ts`
- Witness: the fuzz property asserts the contract directly — adding `NO_COLOR` to
  any environment leaves that environment's detected mode unchanged (200 runs
  across `''`/`'1'`/`'true'` × TTY × `CI` × `TERM`). `factory.test.ts` asserts
  the pair that matters together: `mode === 'interactive'` **and**
  `theme.noColor === true` **and** `ink()` undefined, over both `'1'` and `''`.
- Evidence status: **Verified here.** Authored during this session; every listed
  command was run.
- Residual risk: intentional breaking change. A consumer relying on `NO_COLOR`
  to force single-frame output now gets an interactive monochrome TUI. The
  documented escape is `TERM=dumb`, which remains a genuine capability signal, or
  an explicit `mode`. This is the specific risk the rc exists to expose.

### DX-050 — Profunctor Page terminal inspection target

- Design: [`DX-050`](../../design/DX-050-profunctor-page-inspection.md)
- Deterministic proof: per its changelog entry — `lowerProfunctorPageArtifacts()`
  validates the canonical `profunctor-page/0` family and emits deterministic
  `ui-scene-ir/1`, `Surface`, target-map, receipt, cell-source-map, and text
  evidence across six inspection modes
- Evidence status: **Inherited.** Landed on `main` through its own reviewed PR
  and CI before this branch existed. Its specific witnesses were not re-run here.
- Residual risk: unsupported browser semantics remain explicit capability
  residuals; semantic-document sources, application islands, and visible
  unsupported blocks fail closed. Disposition inherited from the cycle, **not
  re-reviewed for this packet**.

### DX-049 — VISOR artifact bundle proof

- Tracker: [#458](https://github.com/flyingrobots/bijou/issues/458)
- Design: [`DX-049`](../../design/DX-049-visor-artifact-bundle-proof.md)
- Deterministic proof: `createVisorArtifactBundleFromGraphql()`,
  `createVisorArtifactBundle()`, `visor-artifact-bundle/1` types, wrapping the
  checked-in DOGFOOD GraphQL fixture path
- Evidence status: **Inherited.**
- Residual risk: #459 packed-cell validation and external renderer/debugger work
  were explicitly out of scope for the cycle.

### RE-036 — packed-cell receipt validation and `Surface` adaptation

- Design: [`RE-036`](../../design/RE-036-packed-bijou-cells-surface-adapter.md)
- Deterministic proof: `adaptPackedBijouCellsToSurface()` copies validated bytes
  and side-table entries without re-encoding cells
- Evidence status: **Inherited.**

### WF-166 — V8 dependency-security closeout

- Design: [`WF-166`](../../design/WF-166-v8-dependency-security-closeout.md)
- Deterministic proof: a regression binds the patched dependency floors and the
  manifest override; a clean `npm ci` reproduces a zero-vulnerability audit
- Replay: `npm audit --omit=dev --audit-level=high`
- Evidence status: **Verified here** for the audit result; the floor-binding
  regression is inherited.

### WF-167 — roadmap milestone authority

- Design: [`WF-167`](../../design/WF-167-roadmap-milestone-authority.md)
- Evidence status: **Inherited.**

### Maintenance band — Code Dojo ratchets and DOGFOOD documentation

Eleven entries: WF-165 tranches A–E, the DX-050 Code Dojo prerequisites A and B,
the focused ratchet, touched DOGFOOD localization debt, DOGFOOD split-source debt
identity, the documentation contract, future-release milestone triage, and the
DX-048 V8 Runtime Graph shaping record.

- Deterministic proof: the ratchet baselines under
  `scripts/code-dojo/baselines/` are the artifact; the gates are the proof
- Replay: `npm run code-dojo:verify`, `npm run code-dojo:strict`,
  `npm run code-dojo:debt`
- Evidence status: **Verified here.** The pre-commit and pre-push dojo gates ran
  on every commit in this lineage and reported `0 baselined files over 150 lines
  or 12000 bytes`, `0 files over 500 lines`, and `0 baselined ESLint findings`.
  Two files crossed the 150-line threshold while gaining tests during DX-052 and
  were brought back under by tightening prose and collapsing two cases into one
  `it.each`, rather than by adding baseline entries.

### Prerelease gaps found and closed during prep

Cutting the first prerelease this tooling has seen exposed four defects, all
fixed on the release-prep branch and recorded in
[#523](https://github.com/flyingrobots/bijou/issues/523):

1. **DOGFOOD crashed on startup.** It resolved release docs as
   `docs/releases/${BIJOU_VERSION}/`, so `8.0.0-rc.1` produced an unhandled
   `ENOENT` at module load. `smoke:dogfood` reported only `exited with code 1` —
   no path, no stack — so reproducing it meant running the capture entrypoint by
   hand with the scenario environment reconstructed from the smoke library.
2. **The two release gates disagreed** about where release docs live: the
   readiness gate keys the packet path off the milestone, DOGFOOD keyed it off
   the exact version. Resolved in favour of the release *line*, which is why this
   packet lives at `docs/releases/8.0.0/`.
3. **The i18n scanner silently stopped counting two documents.** Templating the
   path with a token the static resolver did not know made the release What's New
   and migration guide unresolvable, so they left the inventory rather than
   failing, and measured Markdown debt fell 78 → 72. An unresolvable token reads
   exactly like a six-point improvement. Fixed by teaching the resolver the
   token; **no baseline lowered and no test edited** to accommodate it.
4. **A prerelease version string overflows the DOGFOOD release nav.** At 120x40,
   `What's New in v8.0.0-rc.1` rendered as `What's New in v8.0.0-rc.`. Release
   guide titles and ids now key off the line, which is also what they describe.
5. **`release:preflight` was a silent no-op, and this packet initially claimed it
   passed.** `scripts/release-metadata.ts` is the CLI entry point but was a pure
   re-export shim; it imported `release-metadata.part04.js` for the side effect of
   *that* module's main guard, which compares `import.meta.url` against
   `process.argv[1]` and therefore never fires when the process starts on the
   shim. The command exited 0 having validated nothing, written no stdout, and
   written no `GITHUB_OUTPUT`.

   `REL-META-VERSION-LOCKSTEP` is the gate the release process assigns to
   `release:preflight`, so version-mismatch detection was unenforced:
   `--version 9.9.9` against an `8.0.0-rc.1` workspace exited 0. The Release Dry
   Run surfaced it only indirectly — its notes job read the missing output as an
   empty tag and failed with `gh: Missing tag_name parameter (HTTP 400)`.

   Every unit test of `runReleaseMetadata()` passed throughout, because the
   function was always correct; nothing called it.
   `tests/cycles/DX-052/release-metadata-entrypoint.test.ts` now invokes the real
   entry point as a child process, which is the only way to observe this class of
   defect.

   **A gate that reports success without running is worse than a missing gate**,
   and the first version of this row in the matrix above recorded exactly that
   false pass. It is corrected rather than quietly overwritten.

One ratchet was tightened rather than loosened: `app-guides-release`'s release
overview summary interpolated the version mid-sentence, counting as two
translatable literals split around an inserted value — word order a translator
cannot rearrange. Moving the value to the end makes it one string, taking total
raw-string debt 2317 → 2316 and the surface 7 → 6. Both baselines shrank to
match.


## Automated Evidence Matrix

| Gate | Command or source | Expected result | Status |
| :--- | :--- | :--- | :--- |
| Workspace lock-step | `npm run version 8.0.0-rc.1` | All ten workspace packages and internal dependency pins report `8.0.0-rc.1`. | Verified here: all ten confirmed. |
| Release metadata preflight | `npm run release:preflight` | Lock-step workspace metadata is valid. | **Initially recorded as passing on exit 0, which was wrong** — the command was a no-op (see below). Fixed on this branch; now prints the eleven-package lock-step summary and exits 1 on a mismatch. |
| Docs inventory | `npm run docs:inventory` | Documentation manifest remains valid after release docs are added. | Verified here: exit 0. |
| Runtime dependency audit | `npm audit --omit=dev --audit-level=high` | Zero high or critical runtime vulnerabilities. | Verified here: `found 0 vulnerabilities`. |
| Release gauntlet | `npm run release:readiness` | The fourteen-gate local gauntlet passes. | Verified here: `release-readiness: ok`. |
| Milestone-aware readiness | `npm run release:readiness -- --milestone v8.0.0` | Target milestone has zero open tracker items and no `work-in-progress` labels. | Verified here: all six report gates PASS. Required first: closing #518 and clearing stale `work-in-progress` labels from the already-closed #482 and #458. |
| Full test suite | `npm test` | Green. | Verified here on this release-prep branch via the gauntlet: 933 test files / 4,130 tests, summed across the twenty vitest chunks. |
| Lint | `npm run lint` | Clean across all workspace packages. | Verified here. |
| Pre-push verification | `.githooks/pre-push` | Full dojo and repo verification, including scripted interactive example smoke. | Verified here: passed on every push in this lineage. |
| PR CI | GitHub Actions on [#522](https://github.com/flyingrobots/bijou/pull/522) | All checks green. | Verified here: 10/10 green including both DOGFOOD smokes, TypeScript doctrine, and focused unit tests on ubuntu and windows. CodeRabbit passed. |
| Release Dry Run | `.github/workflows/release-dry-run.yml` | Packed files and publish dry-runs stay green. | Required before tagging. |
| Tag Guard | `.github/workflows/tag-guard.yml` | The pushed tag resolves to the intended release commit. | Runs after tag push. |
| Publish workflow | `.github/workflows/publish.yml` | Automated npm publishing succeeds for every workspace package. | Runs after tag push. |
| npm registry verification | `npm view <package> version dist-tags --json` | Every package reports `8.0.0-rc.1`. | Required after publish. |

## Human Review Matrix

| Surface | Review disposition |
| :--- | :--- |
| `docs/CHANGELOG.md` | Twenty accumulated entries moved under a dated `8.0.0-rc.1` boundary with a note that the stable `8.0.0` header will consolidate them. `[Unreleased]` intentionally left in place and empty for post-rc work. |
| `README.md` | What's New replaced with v8.0.0-rc.1, leading with the two breaking changes and marking the line as a preview rather than supported. |
| `docs/BEARING.md` | Updated during DX-052 with two new tensions: environment signals are not capability signals, and cross-group token aliasing. **Does not yet describe an 8.0.0 release posture** — needs a maintainer pass before the stable tag. |
| `docs/ROADMAP.md` | **Not reviewed for this release.** References v8.0.0 in ten places, which satisfies the readiness gate, but its content was not re-verified against milestone state. Required before the stable tag. |
| `docs/design/DX-052-*.md` | Status moved to `landed`. |
| `ARCHITECTURE.md` | **Not reviewed.** DX-052 changes no port, adapter, or package boundary, so no update is required *for that goalpost*. The three inherited goalposts touch rendering contracts and were not assessed here. |
| `docs/VISION.md`, `docs/METHOD.md` | **Not reviewed.** No known change required. |
| `docs/DOGFOOD.md` | **Not reviewed.** DOGFOOD smokes pass, but release-title and proof-surface posture for an 8.0.0 line was not assessed. |
| Package READMEs, API references, MCP docs | **Not reviewed.** `extendTheme()`'s public signature gained two optional fields; whether any package README documents that signature was not checked. |

Nine surfaces, three reviewed. That ratio is the honest state of this packet and
is the reason this is an rc.

## Deterministic Reproducibility

Replayable from this commit with no external inputs:

```bash
npm ci
npm run lint
npm test
npx vitest run packages/bijou/src/core/detect packages/bijou/src/core/theme packages/bijou/src/factory.test.ts
npm run code-dojo:verify
npm audit --omit=dev --audit-level=high
```

Normalization notes: the fuzz property in `tty.fuzz.test.ts` is seeded by
`fast-check` defaults and runs 200 cases; it asserts an invariant (mode is
unchanged by `NO_COLOR`) rather than a fixed value, so it does not require
normalization for host colour mode, terminal size, or clock. `factory.test.ts`
uses `mockRuntime`/`mockIO`/`plainStyle` and therefore does not read the host
environment at all.

## Package And Registry Verification Plan

1. Merge the release-prep PR into `main`.
2. Confirm local `main` is exactly `origin/main`.
3. Run the Release Dry Run workflow against the release commit.
4. Tag `v8.0.0-rc.1` on the exact merged `origin/main` commit.
5. Verify Tag Guard, tag CI, and the publish workflow.
6. Verify every package reports `8.0.0-rc.1` on npm.
7. **Confirm the dist-tag is `rc`, not `latest`.** A prerelease published to
   `latest` would silently upgrade every consumer on a caret range.

## Residual Risk

1. **Nine of eleven release-law human review gates are unreviewed** (see the
   matrix). Acceptable for a prerelease whose stated purpose is downstream
   validation; **blocking for the stable `8.0.0` tag**.
2. **Three product goalposts carry inherited rather than replayed evidence.**
   DX-050, DX-049, and RE-036 landed with their own review and CI, but their
   witnesses were not replayed from this commit, which is what `docs/release.md`
   requires. Owner: maintainer. Must be closed before GA.
3. **The breaking changes are unvalidated against real consumers.** That is the
   point of the rc. `muniment` is the first consumer and will pin this version;
   `git-cas` carries a local `detectCliTuiMode` override that is now redundant
   and can be removed once it moves off `^5.0.0`.
4. **The changelog boundary will need consolidating at GA.** Twenty entries now
   sit under an rc header. The stable `8.0.0` header should absorb them rather
   than leave consumers reading release history split across a prerelease.
5. **Open `priority:high` issue #473** (`BAD CODE: make SVG path parsing total
   and non-stalling`) is milestoned `v8.2.0` and is not release-blocking for
   `8.0.0`. Named here rather than left implicit, per `REL-GH-PRIORITY-HIGH-ZERO`.
6. **Known palette defects ship unchanged.** [#519](https://github.com/flyingrobots/bijou/issues/519)
   records that both first-party presets alias one colour across the same ten
   token paths and that `error`/`success` collapse to ΔE 0.059 (dark) and 0.064
   (light) under protanopia, with `bijou-light`'s severity ladder inverted in
   lightness. `DX-052` makes this *escapable* — `extendTheme()` can now reach
   every group — but does not fix it. Consumers relying on the shipped presets
   for severity distinctions should read #519.
