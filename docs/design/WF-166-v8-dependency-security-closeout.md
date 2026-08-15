# WF-166 - V8 Dependency Security Closeout

## Status

Implementation proof in progress for issue
[#482](https://github.com/flyingrobots/bijou/issues/482).

## Linked Legend

- `legend:wf` for release workflow readiness.
- `legend:dx` for deterministic dependency tooling.
- `lane:bad-code` for the vulnerable resolved dependency graph.

## Sponsors

- Human sponsor: James Ross.
- Agent sponsor: Codex.

## Decision Summary

Clear every npm advisory from the resolved workspace dependency graph before
the `v8.0.0` release-preparation cycle begins. Coordinate the now-insufficient
Dependabot pull request
[#467](https://github.com/flyingrobots/bijou/pull/467) inside this issue-backed
cycle instead of merging a patch level that remains vulnerable.

## Hill

Bijou should enter release preparation with a deterministic lockfile that
resolves every currently reported package to a patched version, passes the
complete Node 20 and Node 22 verification matrix, and produces a zero-advisory
`npm audit` result.

## Current Truth

The shaping snapshot on `main` at
`4412ec6dbce947887ed6ea2740ecbad0a66d122e` reported seven npm advisories.
By the implementation pass on 2026-08-15, `origin/main` at
`49671510249fc79ed25b4e8f5796b47d2ad2e11d` exposed 18 open Dependabot
alerts. The carried lockfile attempt also produced four live `npm audit`
package findings: `fast-uri`, `hono`, `ip-address`, and newly disclosed
`nanoid`.

The refreshed candidate dependency paths and resolved versions are:

```text
@flyingrobots/bijou-mcp
  -> @modelcontextprotocol/sdk@1.30.0
    -> @hono/node-server@2.0.12 -> hono@4.13.2
    -> ajv@8.18.0 -> fast-uri@3.1.5
    -> express-rate-limit@8.5.2 -> ip-address@10.5.0
    -> express@5.2.1 -> body-parser@2.3.0
    -> hono@4.13.2
eslint@10.5.0 -> minimatch@10.2.5 -> brace-expansion@5.0.9
vitest@4.1.8 -> vite@8.0.16 -> postcss@8.5.25 -> nanoid@3.3.18
```

The executable regression binds the current patched floors:

- `@hono/node-server@2.0.5` or later;
- `@modelcontextprotocol/sdk@1.30.0` or later;
- `body-parser@2.3.0` or later;
- `brace-expansion@5.0.9` or later;
- `fast-uri@3.1.5` or later;
- `hono@4.12.34` or later;
- `ip-address@10.3.1` or later;
- `nanoid@3.3.18` or later;
- `postcss@8.5.23` or later.

Dependabot pull request #467 resolves `brace-expansion@5.0.7`. The newer
`GHSA-mh99-v99m-4gvg` advisory includes that version, so the pull request no
longer satisfies its security purpose.

## Scope

- Update the deterministic package lock through the package manager.
- Resolve `@modelcontextprotocol/sdk` to `1.30.0` or later within the existing
  declared range.
- Replace the vulnerable exact Hono override with a compatible patched range
  so a clean install cannot reintroduce the advisory-bearing line.
- Resolve every affected transitive dependency to a patched version.
- Preserve the supported Node 20 and Node 22 runtime and test matrix.
- Preserve all public package and command behavior.
- Record the dependency topology, resolved versions, audit result, and
  verification evidence.
- Supersede #467 only after the replacement branch proves
  `brace-expansion@5.0.9` or later.

## Non-Goals

- No public API or runtime behavior redesign.
- No broad dependency modernization beyond the shared security resolution.
- No audit suppression, ignore rule, or accepted vulnerable version.
- No version bump, release tag, GitHub Release, npm publication, or milestone
  closure.
- No Code Dojo exception removal; the final `12 -> 0` goalpost follows this
  security cycle.

## Dependency And Compatibility Contract

The change is acceptable only when:

- `package-lock.json` is reproducible from the declared workspace manifests;
- the resolved graph contains no version covered by the current advisories;
- the existing `@modelcontextprotocol/sdk` public usage compiles and its MCP
  tests pass;
- Node 20 and Node 22 repository tests remain green;
- the full Code Dojo and DOGFOOD smoke gates remain green;
- `npm audit --audit-level=low` exits successfully.

The package-manager lockfile is authoritative for resolved versions. The live
npm advisory service is authoritative for the release audit result.

## Tests To Write First

The deterministic RED proof reads the lockfile and rejects the vulnerable
resolved versions named above. It must fail on the merge-base lockfile before
the update and pass afterward.

The external advisory proof is:

```bash
npm audit --audit-level=low
```

The local compatibility and product proof includes:

```bash
npx vitest run --config vitest.config.ts \
  tests/cycles/WF-166/dependency-security-closeout.test.ts
npm run build
npm run typecheck:test
npm run lint
npm run lint:eslint
npm run code:size
npm run code-dojo:ci
npm run smoke:dogfood
npm run docs:inventory
npm run docs:design-system:preflight
npm run verify:interactive-examples
npm ci
npm audit --audit-level=low
npm run code-dojo:ci
npm run smoke:dogfood
npm run docs:inventory
npm run docs:design-system:preflight
npm run verify:interactive-examples
```

The second full run proves that a clean install from the committed lockfile
preserves the repository's supported execution surface. Hosted CI repeats the
full repository lane as the `test (20)` and `test (22)` jobs and runs the two
DOGFOOD smoke jobs independently.

## Implementation Plan

1. Land this design and tracker/roadmap synchronization.
2. Add the lockfile security regression and prove it RED.
3. Run the package-manager security update and inspect the exact lockfile diff.
4. Prove the lockfile regression and live audit GREEN.
5. Run focused MCP, package, Node 20/22, Code Dojo, DOGFOOD, and documentation
   gates.
6. Run `npm ci` and repeat the full gate from the committed lockfile.
7. Complete documentation upkeep, self-review, hosted review, and Code Lawyer.
8. Merge the replacement and close #467 as superseded only after exact-head
   evidence is green.

## Acceptance Criteria

- [x] Every affected direct and transitive dependency path is documented.
- [x] The deterministic lockfile regression fails on the merge-base graph.
- [x] `npm audit --audit-level=low` reports zero vulnerabilities.
- [x] `package-lock.json` resolves patched versions without unrelated package
  churn.
- [x] A clean `npm ci` reproduces the verified graph.
- [ ] Full Node 20 and Node 22 tests, typecheck, Code Dojo, DOGFOOD smoke, and
  documentation gates pass.
- [ ] PR #467 is explicitly superseded rather than merged at a still-vulnerable
  version.
- [ ] Issue #482 records the final resolved versions and audit evidence.

## Playback Questions

- Does the lockfile contain every expected patched version and no affected
  predecessor?
- Does a clean install reproduce the same resolved graph?
- Does the MCP package behave identically after its transitive Hono server
  update?
- Does the live audit report zero at the exact reviewed head?
- Is every lockfile change explained by an advisory path or deterministic
  pruning of an orphaned lock entry?

## Retrospective

The security pass had to be refreshed against live advisory truth rather than
the original shaping snapshot. The first carried lock attempt still admitted
newer `fast-uri`, Hono, and `ip-address` advisories and predated the `nanoid`
advisory. Its regression could therefore false-green. Raising the executable
floors and binding the root Hono override made the clean-install promise real.

`npm audit fix --package-lock-only` also demonstrated why audit success is not
the complete proof: it temporarily pruned the manifest-required SheetJS entry
and reported zero vulnerabilities, while `npm ci` correctly rejected the
inconsistent lock. Regenerating through `npm install --package-lock-only`
restored that entry; the repeated clean install, audit, full `930` file / `4,104`
test suite, DOGFOOD smoke, documentation preflight, and interactive examples
then passed. Hosted Node 20/22 evidence, #467 disposition, and the final #482
closeout remain merge-bound acceptance steps.
