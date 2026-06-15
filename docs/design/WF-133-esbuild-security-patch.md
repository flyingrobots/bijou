# WF-133 - Esbuild Security Patch

## Status

In progress for issue
[#357](https://github.com/flyingrobots/bijou/issues/357).

## Linked Legend

- `legend:wf` for release workflow readiness.
- `dependencies` for package-lock security posture.

## Sponsors

- Human sponsor: James Ross.
- Agent sponsor: Codex.

## Hill

Before `v7.2.0` ships, Bijou's development dependency graph should resolve the
patched `esbuild@0.28.1` release so GitHub and npm audit no longer report the
known `esbuild@0.28.0` security advisories.

## Problem

`npm audit` reports the lockfile-resolved `esbuild@0.28.0` package against two
GitHub advisories:

- `GHSA-gv7w-rqvm-qjhr` (`high`), patched in `0.28.1`.
- `GHSA-g7r4-m6w7-qqqr` (`low`), patched in `0.28.1`.

The package is present through development tooling, not Bijou runtime API:

- `tsx@4.22.4` accepts `esbuild@~0.28.0`.
- `vitest@4.1.8` pulls `vite@8.0.16`, whose optional peer accepts
  `esbuild@^0.27.0 || ^0.28.0`.

## Scope

- Update the package lock so `esbuild` resolves to `0.28.1`.
- Avoid broad package churn or unrelated runtime dependency changes.
- Record the security patch in the unreleased changelog.
- Keep `v7.2.0` bounded: this is an urgent dependency-security repair, not a
  new feature slice.

## Non-Goals

- Do not expand the v7.2.0 stabilization release into the broader V8/V9 work.
- Do not change application code or public API contracts.
- Do not revive the closed Dependabot PR #326; supersede it with this
  issue-backed cycle.

## Agent Inspectability / Explainability Posture

The proof is intentionally mechanical:

- `npm ls esbuild --all` shows the resolved version.
- `npm audit --audit-level=low` reports zero vulnerabilities.
- the package-lock diff is limited to the patched package metadata.

## Linked Invariants

- Release Claims Need Proof.
- Work Is Issue-Backed.
- Security fixes should minimize unrelated dependency churn.

## Implementation Plan

1. Shape #357 and this design record.
2. Update the lockfile to resolve `esbuild@0.28.1`.
3. Add a changelog entry under `Unreleased`.
4. Run audit, lint, typecheck, tests, docs inventory, and diff checks.
5. Open a non-draft pull request against `main`.

## Tests To Write First

No code-level regression test is needed because this cycle changes package
resolution only. The deterministic regression check is the package-manager
audit itself:

```bash
npm audit --audit-level=low
```

## Acceptance

- `package-lock.json` resolves `esbuild@0.28.1`.
- `npm audit --audit-level=low` exits cleanly.
- Relevant repo validation passes.
- #357 is closed by the pull request.

## Retrospective

To be completed when the PR lands.
