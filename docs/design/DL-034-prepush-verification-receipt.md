---
title: DL-034 Pre-Push Verification Receipt
lane: bad-code
priority: medium
github_issue: 648
status: active
keywords:
  - hooks
  - pre-push
  - verification
  - receipt
  - code-dojo
  - developer-experience
---

# Pre-Push Verification Receipt

## Linked Work

- Decision: [#648](https://github.com/flyingrobots/bijou/issues/648)
- Parent container: [#479](https://github.com/flyingrobots/bijou/issues/479)
- Dependents, in order:
  [#649](https://github.com/flyingrobots/bijou/issues/649) witness command,
  [#650](https://github.com/flyingrobots/bijou/issues/650) receipt-validating
  pre-push,
  [#651](https://github.com/flyingrobots/bijou/issues/651) full-verification
  mode,
  [#652](https://github.com/flyingrobots/bijou/issues/652) contributor docs
- Sibling decision: [#608](https://github.com/flyingrobots/bijou/issues/608)
  fast PR lane versus full release-grade lane (DL-030). Its record was not
  published when this record was written. See
  [Relationship to DL-030](#relationship-to-dl-030).

## Sponsors

- **Human:** James Ross. Delegated the decision. A green local policy must not be
  lost to an idle SSH connection, and hooks must never be bypassed.
- **Agent:** Claude. Converted the PR #478 evidence into a binding that makes a
  stale or forged receipt fail closed.

## Decision Summary

The witness command runs the complete local pre-push policy against a clean
working tree. On success it writes a receipt keyed by the **Git tree object**
that was verified. The receipt also binds the installed dependency state, the
Node and npm toolchain, the platform, and a digest of the exact ordered command
set. It is signed with a per-clone key. The receipt and key live under the Git
common directory, so no worktree can stage them. A receipt is valid for
**24 hours** and only for an exact match on every bound field.

For each pushed ref, pre-push recomputes every field for the commit being
pushed. It accepts the push in seconds only when a matching, unexpired, correctly
signed receipt exists. In every other case it fails, names the field that
did not match, and prints the one command that fixes it. It never runs the suite
silently and never treats a missing receipt as permission to proceed. CI stays
the independent remote authority, and a receipt never reaches GitHub.

## Current Hook Boundary

Grounded in `origin/main` at `63ea8d19`:

- `.githooks/pre-push` runs `npm run -s code-dojo:prepush`
  (`code-dojo:debt`, `code-dojo:strict`, `lint`, `lint:eslint`), then
  `scripts/hooks/pre-push`.
- `scripts/hooks/pre-push` warns about commit pacing. It runs the DOGFOOD i18n
  gates (`dogfood:i18n:complete`, `dogfood:i18n:check`, `dogfood:i18n:debt`)
  only when pushed paths are DOGFOOD-relevant or `BIJOU_FULL_PUSH=1`. It then
  runs `code:size`, `typecheck:test`, `test:run` and
  `verify:interactive-examples`.
- `scripts/hooks/pre-commit` checks lockfile consistency
  (`check-staged-workspace.ts`, `npm ls --all`). The `code-dojo:precommit`
  gate runs staged-file checks, typecheck and lint.
- Git opens the remote transport before it starts pre-push. That is why the
  multi-minute `test:run` (879 files and 3,977 tests on PR #478) can outlive
  the SSH connection.
- `AGENTS.md` and the global working agreement forbid `--no-verify`,
  `core.hooksPath` overrides and any weakening of a hook. The receipt must
  therefore be a *faster proof*, not a softer gate.

## What the Receipt Binds

| Field | Value | Why it is bound |
| --- | --- | --- |
| `schema` | `bijou.verify-receipt.v1` | A format change invalidates every old receipt. |
| `tree` | `git rev-parse <commit>^{tree}` of the verified commit | This is the exact content that was verified. It covers source, tests, config, `package.json`, `package-lock.json`, generated catalogs, baselines and the hook scripts. |
| `installedDeps` | SHA-256 of `node_modules/.package-lock.json` | `package-lock.json` is already in the tree. This field proves that the *installed* modules matched it when the suite ran. |
| `node` | `process.version` | Test and typecheck behavior depends on the runtime. |
| `npm` | `npm --version` | It selects the script runner and the workspace resolution. |
| `platform` | `${process.platform}-${process.arch}` | Terminal and smoke behavior differs between platforms. A receipt is never portable. |
| `policyDigest` | SHA-256 of the canonical JSON of the ordered command list | Any change to the command set, its order or its environment invalidates the receipt. |
| `policyEnv` | The fixed environment the witness forces, for example `BIJOU_FULL_PUSH=1` | The witness always runs the DOGFOOD gates. Path relevance can never make a receipt narrower than a push. |
| `completedAt`, `expiresAt` | ISO-8601 UTC; `expiresAt = completedAt + 24h` | Bounds reuse in time. |
| `mac` | HMAC-SHA-256 over the canonical JSON of every other field | Detects hand-written, edited or copied receipts. |

### Tree, not commit

The receipt binds the tree, not the commit. Commit metadata (message, author,
parents, signature) does not change what the suite verified. The repository
forbids amend and rebase, but a merge commit from `main` that produces an
identical tree, or a reworded commit, still needs no second run. A commit binding
would force reruns that prove nothing. A tree binding is exact: one byte of
difference in any tracked file gives a different tree.

### Clean working tree, so no untracked-input hash

The witness **refuses to run** unless `git status --porcelain` is empty, which
means no staged, unstaged or untracked non-ignored files. The suite then ran
against exactly `HEAD^{tree}`. Uncommitted edits cannot leak into a green result
that is then attributed to a commit that does not contain them. A separate hash
of untracked inputs is not needed. Ignored inputs that change behavior are bound
explicitly (`installedDeps`, toolchain). Everything else under `.gitignore` is
build output that the policy regenerates.

### One command set

The ordered command list moves out of the two hook scripts into one manifest,
`scripts/hooks/verify-policy.mjs`. The witness and the full-verification mode
both run from it, and pre-push digests it. The two modes cannot drift apart, and
the digest in a mismatch message is readable. The tree already contains the
manifest. The separate digest exists to give a precise diagnosis.

## Where It Lives

```text
$(git rev-parse --git-common-dir)/bijou/verify/
  key                 32 random bytes, mode 0600, created on first witness run
  receipts/<tree>.json
```

- The path is under the Git common directory, never the worktree. It cannot be
  staged, it is in no diff, and `.gitignore` cannot omit it by mistake.
- The common directory (not the per-worktree `git-dir`) is used because the
  receipt is keyed by tree. A tree verified in one worktree is the same content in
  every other worktree of the same clone. Toolchain and dependency fields still
  have to match the worktree that pushes.
- One file per tree means that concurrent pushes from different worktrees do
  not overwrite each other. Each write is atomic: write to `<tree>.json.tmp-<pid>`,
  `fsync`, then `rename`. An interrupted run leaves no partial receipt.
- `.cache/` was rejected as the location. It is per-worktree, `git clean -X`
  removes it, and it is inside the content area that agents and tools scan.

## Expiry and Invalidation

A receipt is invalid if any one of these conditions is true:

1. No file `receipts/<tree>.json` exists for the tree of the pushed commit.
2. The JSON is malformed, a field is missing, or `schema` is unknown.
3. `mac` does not verify with the local key, or no key exists.
4. `installedDeps`, `node`, `npm`, `platform`, `policyDigest` or `policyEnv`
   differs from the value that pre-push recomputes now.
5. `now >= expiresAt`, or `completedAt` is more than 5 minutes in the future
   (clock skew or a fabricated timestamp).

The expiry is 24 hours. Content binding already makes reuse exact, so the
window is not the main defense. It limits the inputs that cannot be hashed
cheaply: system libraries, terminal capabilities, and time-dependent tests. It
also keeps the receipt store small. Each witness run removes receipts that are
older than the expiry. The duration is a constant in the manifest, so a change
to it changes `policyDigest`.

## What Pre-Push Does

For each line on standard input:

- **Delete push** (`local_oid` is all zeros): no receipt is needed.
- **Any other push**: resolve `local_oid^{tree}` and validate it as described
  in the previous section. Every pushed ref must pass. One valid receipt never
  covers another ref with a different tree.

If every ref passes, pre-push prints the matched tree and the receipt age, keeps
the commit-pacing warning, and exits 0. The target is under 5 seconds and no
suite runs.

If a ref does not pass, pre-push exits non-zero. It names the ref, the tree and
the first failing condition, for example
`installedDeps changed since verification`. It then prints exactly:

```text
Run: npm run verify:witness   (then push again)
```

It does not run the suite as a fallback. A silent fallback would bring back the
idle-transport failure that #479 removes. Only the explicit full-verification
mode (#651) runs the suite from within the hook.

The witness verifies `HEAD`. To push a commit that is not `HEAD`, the
contributor checks it out and runs the witness there. This case is rare enough
that a flag is not justified.

## Security Properties

- **Fail closed.** Every missing, unreadable, mismatched, expired or unsigned
  state rejects the push. No code path accepts a receipt it could not fully
  validate.
- **Content-exact.** One changed byte in any tracked file changes the tree, and
  the lookup then finds no receipt. A receipt for tree A cannot authorize tree B.
- **Not a bypass.** The receipt is created only by running the full policy, and
  that policy is at least as strong as the current hook, because DOGFOOD gates
  are forced on. Writing, editing or copying a receipt by hand counts as hook
  bypass under `AGENTS.md`, the same as `--no-verify`, and needs the same
  per-operation human permission.
- **Forgery resistance in scope.** The HMAC key stops receipts that were typed,
  generated by an agent without a run, or copied from another machine or clone. It
  does not stop a local user who reads the key and computes a MAC on purpose.
  That user can already run `git push --no-verify`. Local hooks are not a trust
  boundary against their own operator, and this design does not pretend
  otherwise.
- **CI stays authoritative.** Receipts are never pushed, uploaded or read by
  workflows. A receipt cannot suppress, shorten or satisfy any GitHub check.
- **No secret leaves the clone.** The key is random per clone, never derived
  from user credentials, and never printed.

## Relationship to DL-030

DL-030 (#608) decides which gates run in the fast PR lane and which run in the
full release lane in **CI**. It also names a pre-push fast lane as a dependent.
This record does not decide CI lanes and assumes nothing about them, except
these points:

- The receipt certifies *the local pre-push policy as defined in
  `scripts/hooks/verify-policy.mjs`*. If DL-030 changes that policy, the
  change takes effect through the manifest, and the changed `policyDigest`
  invalidates every existing receipt automatically.
- No CI lane may accept a local receipt as evidence. If DL-030 contradicts this
  point, that is a conflict to resolve in a later decision record, not by
  reading either record loosely.

## Alternatives Considered

### Bind the HEAD commit only

This is the simplest option. Rejected because a commit hash does not cover the
installed dependencies, the toolchain or the command set. A receipt would
survive `npm install` of a different tree of modules or a switch to another Node
version. It also covers too much: an identical tree under a different commit
would force a rerun. It is weaker and more expensive at the same time.

### Hash the working tree and untracked inputs, and allow dirty verification

This approach hashes every tracked and untracked non-ignored file, so the
witness can run on uncommitted work. Rejected because the pushed object is a
commit, not a working directory. A dirty-tree receipt would certify content that
the push does not contain, or would need a second comparison step to
reconstruct the commit. A clean-tree precondition gives the same precision with
no new hashing code, and `git` already computes the tree.

### Keep the suite in pre-push and add SSH keepalive or retries

Rejected on evidence. PR #478 lost the connection even with keepalive while the
879-file suite ran. Retries repeat the full cost and still couple verification to
transport.

### Store the receipt in `.cache/` or a tracked `.verification/` file

A tracked file is a commit that certifies itself, and it changes the tree that it
claims to certify. `.cache/` is per-worktree, `git clean -X` removes it, and an
ignore-rule change could expose it. Under the Git common directory none of these
risks exist.

### No HMAC, structural validation only

This option is cheaper. Rejected because the most likely source of a fake
receipt in this repository is an agent that "helpfully" writes the JSON after a
partial run. A per-clone MAC costs about twenty lines of code and makes that
mistake fail closed.

## Consequences

- A normal push is fast and does not depend on the transport. Verification cost
  moves to an explicit step that the contributor controls.
- Contributors must commit before they verify. Uncommitted work
  cannot be certified.
- Any dependency reinstall, Node upgrade or policy edit requires a new witness
  run. This is intentional.
- A new pre-push failure mode, "no receipt", becomes the common first-push
  experience. The remediation line must be exact, and #652 must document it.
- The hook scripts gain a shared manifest. Code-size and Code Dojo ratchets
  apply to it like any other script.
- Reversal before #650 merges costs nothing. After #650 merges, a change to the
  binding is a schema bump (`v2`), and the schema bump invalidates old receipts
  safely.

## Contracts for Dependents

### #649 Witness command

- Adds `npm run verify:witness`, implemented in `scripts/hooks/`, and adds
  `scripts/hooks/verify-policy.mjs` as the only source of the ordered command
  list and of `policyEnv` (`BIJOU_FULL_PUSH=1`).
- Refuses to run, and writes nothing, when `git status --porcelain` is not empty.
- Runs every manifest command in order and stops at the first failure. On any
  failure, or on a signal, it writes no receipt.
- On success, it writes `receipts/<HEAD^{tree}>.json` with the fields in this
  record, by an atomic rename. It replaces an existing receipt for the same tree
  and removes expired receipts.
- Creates the key with mode 0600 if it is absent. It never prints the key.
- Exports a pure `validateReceipt(receipt, observed, key, now)` that returns
  `{ ok: true } | { ok: false, reason }`. #650 consumes this function.
- Tests: green run writes a receipt; failing run writes none; dirty tree is
  refused; existing receipt is replaced; interrupted write leaves no `.json`
  file.

### #650 Receipt-validating pre-push

- `.githooks/pre-push` validates the tree of each non-delete pushed ref with
  `validateReceipt`. By default it runs no suite.
- On any failure it exits non-zero with the ref, the tree, the reason and the
  line `Run: npm run verify:witness`.
- Keeps the commit-pacing warning. Removes the per-path DOGFOOD gating from the
  default mode, because the witness always runs those gates.
- Tests cover these cases: valid; missing; malformed; bad MAC; missing key;
  expired; future `completedAt`; each of `installedDeps`, `node`, `npm`,
  `platform`, `policyDigest` and `policyEnv` mismatched; a changed tracked file
  (new tree); a multi-ref push where one ref has no receipt; a delete push.
- No change to `.github/workflows/`.

### #651 Full-verification mode

- Enabled by `git config bijou.prepush.mode full` (persistent per clone) or by
  `BIJOU_PREPUSH_MODE=full` (per invocation; it overrides the config). An
  unknown value is an error, not a fallback to a weaker mode.
- In full mode, pre-push runs the same manifest as the witness, against each
  pushed tree, and ignores receipts. It writes a receipt on success, as a
  convenience for the next push.
- No mode, value or variable skips a check. The only modes are `receipt`
  (default) and `full`.

### #652 Documentation

- Contributor documentation names `npm run verify:witness`, the receipt
  location, the 24-hour expiry, the invalidation list and both settings for
  full mode.
- Says plainly that CI is the remote authority, and that a hand-written or
  copied receipt is a hook bypass.
- Never recommends `--no-verify` or editing a receipt.
- Adds a `docs/CHANGELOG.md` entry.
