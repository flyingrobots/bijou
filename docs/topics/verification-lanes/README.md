# Verification lane classifier

`npm run verify:lane` maps a set of changed paths to the **fast** or the
**full** verification lane, with the rule that decided each path. It implements
the path classification of
[DL-030](../../design/DL-030-fast-and-full-verification-lanes.md). It is a
classifier only: no hook, witness or workflow reads its output yet, so it does
not change which checks a push or a pull request must pass.

## The decision

`classifyVerificationLane(paths)` and `classifyChanges(changes)` in
`scripts/verification-lane.ts` are pure functions. Each path takes the first
rule in `LANE_RULES` (`scripts/verification-lane-rules.ts`) whose glob matches
it. Every full rule comes before every fast rule, so a path that matches both
is full. The diff is full when any path is full.

The fast rules are an allow-list. The diff is full, with reason `unknown`, for:

- a path that matches no rule;
- an empty change set;
- a path that is not a repository-relative POSIX path (empty, absolute,
  containing `\`, a line break, or an empty, `.` or `..` segment).

Only an addition (`A`) or a modification (`M`) may take a fast rule. A deleted
(`D`), renamed (`R`), copied (`C`), type-changed (`T`) or unmerged (`U`) path,
or one with any other status letter, is full. Its entry keeps the rule it
matched and names the cause in `escalation`. A rename contributes both its old
and its new path. Bare paths (`classifyVerificationLane`, or a `--paths-from`
list without status letters) carry no status and are classified by rule alone.

Globs follow picomatch defaults: `*` stays inside one segment, `**` spans
segments, and no wildcard matches a segment that starts with `.`. A dot path
such as `docs/.vitepress/config.ts` is therefore `unknown`.

## Rules

| Reason | Lane | Patterns |
| --- | --- | --- |
| `ratchet-baseline` | full | `scripts/code-dojo/baselines/**`, `scripts/code-size-gate-baseline.ts`, `examples/docs/i18n-debt-baseline*.ts`, `docs/code-dojo-exceptions.md` |
| `gate-definition` | full | `.github/**`, `.githooks/**`, `scripts/hooks/**`, `scripts/code-dojo/**`, `scripts/verification-lane*`, `scripts/run-vitest.mjs`, `scripts/docker-seal/**`, `scripts/code-dojo-*`, `scripts/code-size-gate*`, `schemas/**` |
| `toolchain` | full | `package.json`, `package-lock.json`, `tsconfig*.json`, `vitest.config.*`, `eslint.config.*`, `.nvmrc`, `.npmrc` |
| `generated-asset` | full | `examples/docs/i18n/catalogs/**`, `docs/book/source-corpus.json`, `docs/book/source-manifest.json`, `docs/book/*.pdf`, `docs/book/*.tex`, `bench/baselines/**` |
| `release-doc` | full | `docs/releases/**`, `README.md`, `packages/*/README.md`, `scripts/release-*` |
| `core-runtime` | full | `packages/*/src/**` except `**/*.test.{ts,mjs}`, `packages/*/package.json`, `packages/*/bin/**` |
| `dogfood-source` | full | `examples/**`, `scripts/dogfood-*`, `scripts/smoke-*`, `tests/cycles/DF-*/**`, `tests/cycles/*dogfood*/**` |
| `toolchain` | full | `**/package.json`, `**/package-lock.json`, `**/tsconfig*.json` |
| `test-only` | fast | `**/*.test.ts`, `**/*.test.mjs`, `tests/**` |
| `docs-only` | fast | `docs/**`, `*.md` |
| `script-tooling` | fast | `scripts/**/*.ts`, `scripts/**/*.mjs` |
| `unknown` | full | any path that matches no rule |

Against the DL-030 table, the full rules add the sealed runner, the Code Dojo
and code-size gate scripts, `schemas/**`, and nested `package.json`,
lockfiles and `tsconfig*.json`. Each addition moves paths from fast or
`unknown` to a named full reason; none moves a path to fast. The order puts
`ratchet-baseline` first so that a baseline under `examples/docs` reports
`ratchet-baseline`, not `dogfood-source`.

`docs/CHANGELOG.md` is `docs-only`. Nearly every pull request edits it.

Every fast pattern has an entry in `FAST_JUSTIFICATIONS` naming what still
verifies a change to it: the fast lane's build, ratchets, lint, test type
check, DOGFOOD localization gates and related tests, and the full lane that
DL-030 runs before every merge.

## The `dogfood` flag

`dogfood` is true when any path matches the DOGFOOD-relevance patterns that the
pre-push hook and `ci.yml` evaluate in shell (`DOGFOOD_PATTERNS`, where `*`
matches across `/`). An empty change set or an invalid path also sets it. It is
independent of the lane: `docs/CHANGELOG.md` is fast and DOGFOOD-relevant.
Until flyingrobots/bijou#611 removes the shell copies,
`scripts/verification-lane-parity.test.ts` runs both shell functions over every
tracked path and fails on any disagreement.

## Command

```sh
npm run verify:lane                                # merge base with origin/main to HEAD
npm run verify:lane -- --base <ref>                # merge base with <ref> to HEAD
git diff --name-status main | npm run verify:lane -- --paths-from -
npm run verify:lane -- --human                     # prose, ends with lane=<fast|full> dogfood=<true|false>
npm run verify:lane -- --help                      # or --schema
```

The diff is `git diff --name-status -z -M` from the merge base to `HEAD`, so
uncommitted changes are not classified. `--paths-from` reads bare paths or
`git diff --name-status` lines (tab-separated). `--json` is accepted and is
the default.

Output is one JSON line on stdout, `kind: "lane-decision"`, carrying `lane`,
`dogfood`, `reasons` (one entry per path: `path`, `status`, `lane`, `reason`,
`pattern`, `escalation`), `requiredPolicy` (`bijou.verify.fast.v1` or
`bijou.verify.full.v1`, from `requiredPolicy(lane)`) and `base`. Every line
carries `_schema` `{ "id": "bijou.verify-lane.event", "version": "1.0.0" }`
and validates against `schemas/bijou.verify-lane.event.v1.schema.json`.

When `$GITHUB_OUTPUT` is set, the command appends `lane=` and `dogfood=` to it.

A failure (bad arguments, a git error, an unparseable diff, an unreadable path
list) exits 1 with one `kind: "error"` line on stderr that still says
`lane: "full"` and `dogfood: true`, and writes `lane=full` and `dogfood=true`
to `$GITHUB_OUTPUT`. It never reports fast.

The test ledger is [test-plan.md](./test-plan.md).
