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
  [#651](https://github.com/flyingrobots/bijou/issues/651) inline
  verification mode,
  [#652](https://github.com/flyingrobots/bijou/issues/652) contributor docs
- Sibling decision: [#608](https://github.com/flyingrobots/bijou/issues/608)
  fast and full verification lanes, recorded as DL-030 in
  [PR #659](https://github.com/flyingrobots/bijou/pull/659). DL-030 selects the
  policy and DL-034 proves the local run. See
  [Relationship to DL-030](#relationship-to-dl-030).
- Related DL-030 tasks: classifier
  [#610](https://github.com/flyingrobots/bijou/issues/610), pre-push fast lane
  [#611](https://github.com/flyingrobots/bijou/issues/611).

## Sponsors

- **Human:** James Ross. Delegated the decision. A green local policy must not be
  lost to an idle SSH connection, and hooks must never be bypassed.
- **Agent:** Claude. Converted the PR #478 evidence into a binding that makes a
  stale or forged receipt fail closed.

## Decision Summary

DL-030 ([PR #659](https://github.com/flyingrobots/bijou/pull/659)) classifies a
change and selects the verification policy it requires: `fast` or `full`. DL-034
decides how a local run of that selected policy is proven to pre-push. The
responsibilities divide as follows:

1. The DL-030 classifier selects the required **policy identity** for the
   change.
2. The witness command runs that selected policy, outside the network transport,
   against a clean working tree. It does not always run the exhaustive policy.
3. The receipt binds the policy identity and every project input of its eligible gates;
   an incomplete input declaration makes receipt reuse unavailable.
4. Pre-push only validates that the receipt the change requires exists and
   matches.
5. CI still runs the required verification independently at merge (DL-030 full
   lane).

On success the witness writes a receipt keyed by the **Git tree object** that
was verified and the policy identity. The receipt also binds the classification
base, actual installed dependency bytes, declared generated-input bytes,
the Node and npm toolchain, the platform,
and a digest of the exact ordered command set of that policy. It is signed with
a per-clone key. The receipt and key live under the Git
common directory, so no worktree can stage them. A receipt is valid for
**24 hours** and only for an exact match on every bound field.

For each pushed ref, pre-push recomputes every field for the commit being
pushed. It accepts the push only when a matching, unexpired, correctly
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
| `installedDeps` | SHA-256 of the canonical dependency-content manifest below | Binds the files actually loaded from installed dependencies, including edits that leave lock metadata unchanged. |
| `generatedInputs` | SHA-256 of the canonical content manifest for the policy's declared generated-input roots | Binds ignored workspace outputs consumed by checks, such as each package's `dist/`; the Git tree does not bind these bytes. |
| `node` | `process.version` | Test and typecheck behavior depends on the runtime. |
| `npm` | `npm --version` | It selects the script runner and the workspace resolution. |
| `platform` | `${process.platform}-${process.arch}` | Terminal and smoke behavior differs between platforms. A receipt is never portable. |
| `policy` | `bijou.verify.fast.v1` or `bijou.verify.full.v1` | These are the DL-030 identities; CLI names `fast` and `full` map to them. Pre-push compares the recorded identity with the policy that the change requires. |
| `classificationBase` | The commit OID from `git merge-base <commit> origin/main` | Both policies run base-sensitive DOGFOOD completeness and debt gates. Fast additionally selects related tests from this diff. A changed base invalidates either policy's receipt. |
| `classification` | The classifier output: lane, `dogfood` flag and reason ids | Pre-push reruns the classifier and requires an exact match, so a receipt cannot carry a stale lane. |
| `policyDigest` | SHA-256 of the canonical JSON of the ordered command list for `policy`, including its environment and the classifier version | Any change to the command set, its order, its environment or the classification rules invalidates the receipt. |
| `completedAt`, `expiresAt` | ISO-8601 UTC; `expiresAt = completedAt + 24h` | Bounds reuse in time. |
| `mac` | HMAC-SHA-256 over the canonical JSON of every other field | Detects hand-written, edited or copied receipts. |

### Tree, not commit

The receipt binds the tree, not the commit. Commit metadata (message, author,
parents, signature) does not change what the suite verified. The repository
forbids amend and rebase, but a merge commit from `main` that produces an
identical tree, or a reworded commit, still needs no second run. A commit binding
would force reruns that prove nothing. A tree binding is exact: one byte of
difference in any tracked file gives a different tree.

### Clean tracked tree and complete input declarations

The witness **refuses to run** unless `git status --porcelain` is empty, which
means no staged, unstaged or untracked non-ignored files. This binds tracked
sources to `HEAD^{tree}`; it says nothing about ignored files. Every project
filesystem input that can affect an eligible gate must be tree-bound or
content-manifest-bound. Each gate's policy entry must name its input roots and explain the
boundary; an undeclared input or an unprovable boundary disables receipt reuse.
Git cleanliness is not evidence that ignored configuration or build outputs
cannot affect verification. Project resources outside the tree and dependency
roots must also be declared and manifest-bound if the gate consumes them.
The trusted computing base below is an explicit exception, not an assertion
that version strings prove the identity of system files.

### Actual-content manifests

The manifest format has a version in `policyDigest`. Canonical JSON entries
include a stable root ID and are sorted by normalized root-relative path within
that root. They encode the entry kind, executable bit where
applicable, and SHA-256 of actual regular-file bytes. Directory membership is
included, so additions and removals change the digest. Do not use timestamps,
file sizes, package versions or the hidden lockfile as substitutes for content.
Include hidden dependency files and `.bin` entries.

Symlink entries bind their link text and validated target identity. Resolve
targets before traversal, track visited identities to detect cycles, and reject
unreadable paths, special files, dangling links, cycles and targets outside the
declared dependency or workspace roots. A workspace link is permitted only
when every reachable target is covered by the tracked tree or a declared
generated-input manifest. Linking a package does not exempt its ignored `dist/`
from the binding. Absolute machine paths are not written to receipts.

The shared policy manifest lists the exact generated-input roots used by the
gates, including workspace build outputs. It also lists any other ignored or
external filesystem input roots they require. Changing this declaration changes
`policyDigest`. Gate caches, logs and mutable test fixtures must use separate
output roots; they cannot be silently excluded from an input root.

For trusted cooperative local development, the witness holds an exclusive
verification-custody lease covering installation and writes to declared input
roots, from initial input capture through receipt publication. All supported
install, build and witness workflows share this protocol. The witness captures
tracked and dependency inputs before classification; build is the first
verification gate and may write only declared output roots. After build, the
witness captures generated inputs. Remaining gates write caches, logs and
fixtures only to separate output roots.

The witness rechecks actual-content digests and tracked-tree cleanliness before
publication. Missing input coverage, absent writer participation or lost custody
refuses reuse. Pre-push holds equivalent custody while recomputing content
digests without an mtime-only cache and admitting the receipt. #649 must define
the concrete lock keys, ownership and failure handling before enabling reuse.
The protocol detects stale bytes and excludes cooperating concurrent writers;
it does not claim OS-enforced immutability against arbitrary local writers or
operators deliberately ignoring the lease. Deliberate mutation-and-restoration
outside the protocol is outside the trusted-operator boundary. Before/after
hashes alone would not detect that attack.

### One command set per policy

DL-030 owns the gate lists and the classifier (`scripts/verification-lane.ts`,
#610). DL-034 does not define gates. The ordered local command list for each
policy identity (`bijou.verify.fast.v1`, `bijou.verify.full.v1`) is exported from
one manifest, which the DL-030 implementation owns. The witness, the inline
verification mode (#651) and the pre-push validator all read that manifest.
They cannot drift apart, and the
digest in a mismatch message is readable. The tree already contains the
manifest. The separate digest exists to give a precise diagnosis.

### Which receipt satisfies which requirement

The required policy is the DL-030 classification of the pushed commit against
`classificationBase`. CLI shorthand `fast` and `full` maps to the versioned
identities in the receipt. `BIJOU_FULL_PUSH` is retired; use
`npm run verify:witness -- --policy full` to request the full policy explicitly.

| Required | `fast` receipt | `full` receipt |
| --- | --- | --- |
| `fast` | accepted | accepted (full contains fast) |
| `full` | rejected | accepted |

The witness runs the required policy by default. `npm run verify:witness --
--policy full` runs `full` voluntarily. A request for a policy weaker than the
classification is an error, not a downgrade.

An explicit full run on a fast-classified change records the classifier's
unchanged fast output in `classification` and `bijou.verify.full.v1` in `policy`.
Classification describes the change; policy describes the work performed.

The table describes policy compatibility only. Every bound input must still
match, including `classificationBase` and `classification`, for either policy.
Running every test does not make a base-sensitive localization check independent
of its base. Unconditional reuse of full receipts was rejected because a moved
base can change which strings the touched-file rule must examine.

## Where It Lives

```text
$(git rev-parse --git-common-dir)/bijou/verify/
  key                 32 random bytes, mode 0600, created on first witness run
  receipts/<tree>.<policy>.json
```

- The path is under the Git common directory, never the worktree. It cannot be
  staged, it is in no diff, and `.gitignore` cannot omit it by mistake.
- The common directory (not the per-worktree `git-dir`) is used because the
  receipt is keyed by tree. A tree verified in one worktree is the same content in
  every other worktree of the same clone. Toolchain and dependency fields still
  have to match the worktree that pushes.
- One file per tree and policy keeps different policies separate. Each write is
  atomic: create a unique temporary file beside `<tree>.<policy>.json`, write
  and `fsync` it, then `rename` it over the destination. Concurrent writes for
  the same tree and policy may replace each other; the reader still validates
  every bound input. An interrupted run leaves no partial destination receipt.
- `.cache/` was rejected as the location. It is per-worktree, `git clean -X`
  removes it, and it is inside the content area that agents and tools scan.

## Expiry and Invalidation

A receipt is invalid if any one of these conditions is true:

1. No receipt exists for the tree of the pushed commit at a policy that satisfies
   the requirement (see the table above).
2. The JSON is malformed, a field is missing, or `schema` is unknown.
3. `mac` does not verify with the local key, or no key exists.
4. `classificationBase`, `classification`, `installedDeps`, `generatedInputs`, `node`, `npm`,
   `platform` or `policyDigest` differs from the value that pre-push recomputes now. A fetch
   that moves `origin/main` can therefore invalidate a receipt. This is
   intentional, because the classification and the related tests change with
   the base.
5. `now >= expiresAt`, or `completedAt` is more than 5 minutes in the future
   (clock skew or a fabricated timestamp).

The expiry is 24 hours. Expiry limits age; it does not compensate for missing
project-input bindings or uncontrolled environment inputs. Each witness run removes receipts that are
older than the expiry. The duration is a constant in the manifest, so a change
to it changes `policyDigest`.

## What Pre-Push Does

For each line on standard input:

- **Delete push** (`local_oid` is all zeros): no receipt is needed.
- **Any other push**: compute `base` (the observed `classificationBase`),
  run the DL-030 classifier on
  `base..local_oid` (path classification takes milliseconds and runs no gates),
  derive the required policy, resolve `local_oid^{tree}`, and validate the
  receipt as described in the previous section. Every pushed ref must pass. One
  valid receipt never covers another ref with a different tree.

If every ref passes, pre-push prints the matched tree and the receipt age, keeps
the commit-pacing warning, and exits 0. The target is under 5 seconds and no
suite runs. This is a performance target, not a demonstrated bound: #649/#650
must measure content-hashing and admission cost on the actual installed tree.
The implementation must not weaken the binding to meet the target.

If a ref does not pass, pre-push exits non-zero. It names the ref, the tree and
the first failing condition, for example
`installedDeps changed since verification`. It then prints exactly:

```text
Run: npm run verify:witness   (then push again)
```

It does not run the suite as a fallback. A silent fallback would bring back the
idle-transport failure that #479 removes. Only the explicit inline
verification mode (#651) runs the selected policy from within the hook.

The witness verifies `HEAD`. To push a commit that is not `HEAD`, the
contributor checks it out and runs the witness there. This case is rare enough
that a flag is not justified.

## Security Properties

The trusted local computing base comprises the operating system, system
libraries, runtime and toolchain executables. This design assumes that base
remains suitable and unchanged during receipt reuse; it does not hash or attest
its binaries. Node/npm versions and platform are compatibility and invalidation
signals, not proof of binary identity. A known computing-base change requires a
new witness. Undetected changes to that base are outside the content-exact
guarantee, and the 24-hour expiry does not repair that limitation.

The policy manifest declares and fixes the relevant environment settings used by
each gate; their canonical names and values contribute to `policyDigest` and
are recomputed during admission. Gates must control time, random
seeds and external service responses where these affect the verified outcome,
or explicitly declare that dependency and make its evidence ineligible for
reuse. An unchanged project cannot be treated as proof of unchanged external
state. #649 audits these boundaries before enabling receipts. CI independently
rechecks the required gates in its own environment.

- **Fail closed.** Every missing, unreadable, mismatched, expired or unsigned
  state rejects the push. No code path accepts a receipt it could not fully
  validate.
- **Content-exact within the declared input boundary.** A tracked edit changes
  the tree. A dependency or generated-input edit changes its manifest digest.
  Missing input coverage or verification custody refuses reuse. A receipt for tree A
  cannot authorize tree B.
- **Not a bypass.** A receipt is created only by running the policy that it
  names, and it is accepted only when that policy satisfies the DL-030
  requirement for the change. Local pre-push strength is therefore exactly what
  DL-030 decides. Reuse is conditional on the declared inputs and trusted computing base above;
  it is not an attestation of the entire machine. Writing, editing or copying a receipt by hand counts as hook
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

[DL-030](https://github.com/flyingrobots/bijou/pull/659) (#608) is the authority
for *what* must be verified: the classifier, the policy identities
`bijou.verify.fast.v1` and `bijou.verify.full.v1`, their gate lists, and the
escalation rules. DL-034 is the authority for
*how a local run is proven* to pre-push. Neither record restates the other's
content.

- DL-030 selects the policy required at push. The witness runs that policy
  before the push, and
  pre-push validates the receipt. DL-030's fast-lane pre-push task (#611)
  supplies the classifier call and the policy manifest. #650 supplies the
  receipt check in the hook. Neither task runs the gates inside the hook by
  default.
- When the gate list of a policy changes, the change takes effect through the
  manifest, and the changed `policyDigest` invalidates every receipt for that
  policy automatically.
- No CI lane accepts a local receipt as evidence. The DL-030 full lane at merge
  is the independent remote proof.

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
reconstruct the commit. The clean-tree precondition covers tracked sources;
content manifests additionally cover the ignored inputs that Git does not bind.

### Hash dependency lock metadata only

Rejected: changing an installed JavaScript file without changing
`node_modules/.package-lock.json` preserves the proposed metadata digest while
changing executed code. Editing ignored workspace `dist/` likewise preserves
the Git tree. These are concrete stale-evidence counterexamples. The chosen
content manifests detect both, at the cost of reading the actual input bytes.

### Require a permanently immutable dependency installation

A sealed installation could provide stable content identities, but relying on
platform-specific mount or package-store machinery would exclude ordinary
installations. Content manifests work with the existing installation layout.
The witness still needs cooperative verification custody while gates run; permanent
immutability is not assumed from the package manager or from Git cleanliness.

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

- Suite execution moves out of network transport into an explicit step. Push
  still pays content-hashing cost, whose elapsed time must be measured.
- Contributors must commit before they verify. Uncommitted work
  cannot be certified.
- A change to dependency bytes, generated inputs, toolchain or policy requires
  a new witness. A byte-identical reinstall need not invalidate a receipt.
- A new pre-push failure mode, "no receipt", becomes the common first-push
  experience. The remediation line must be exact, and #652 must document it.
- Machine contention moves with the work. On shared workstations, concurrent
  pre-push campaigns from several agents compete for the same host. The
  maintainer currently admits every `git push` through the `git-locks`
  `bijou-prepush` semaphore, which has 5 slots (`git locks with --sem
  bijou-prepush`). This semaphore is the local admission control for
  verification campaigns. After #650 merges, a receipt-mode push is light, so
  the heavy campaign is the witness run. The semaphore then belongs around
  `npm run verify:witness` and around inline-mode pushes (#651), not around
  receipt-mode pushes. The receipt does not depend on admission: a run that
  was not admitted is still exact, only slower.
- The hook scripts gain a shared manifest. Code-size and Code Dojo ratchets
  apply to it like any other script.
- Reversal before #650 merges costs nothing. After #650 merges, a change to the
  binding is a schema bump (`v2`), and the schema bump invalidates old receipts
  safely.

## Contracts for Dependents

### #649 Witness command

- Adds `npm run verify:witness`, implemented in `scripts/hooks/`. It consumes
  the DL-030 policy contract. Initially it adds the shared manifest with the
  current full local command set under `bijou.verify.full.v1` and selects full
  conservatively for every change. It records the merge base and a documented
  full-only classifier version. #611 subsequently integrates #610's classifier
  and the fast policy; its changed manifest digest invalidates earlier receipts.
  #649 does not depend on #611, which itself depends on #649 and #650.
- Refuses to run, and writes nothing, when `git status --porcelain` is not empty.
- Audits input declarations, captures dependencies under exclusive custody, runs build
  first, captures generated inputs, retains custody through the remaining gates, and rechecks
  the bindings before receipt publication. Missing coverage or custody fails
  closed. The root declaration and manifest format are part of `policyDigest`.
- Classifies `base..HEAD` and runs the **selected** policy (`fast` or `full`),
  or `full` when `--policy full` is given. A request for
  a policy weaker than the classification is an error.
- Runs every command of that policy in order and stops at the first failure. On
  any failure, or on a signal, it writes no receipt.
- On success, it writes `receipts/<HEAD^{tree}>.<policy>.json` with the fields
  in this record, by an atomic rename. It replaces an existing receipt for the
  same tree and policy and removes expired receipts.
- Creates the key with mode 0600 if it is absent. It never prints the key.
- Exports a pure `validateReceipt(receipt, observed, key, now)` that returns
  `{ ok: true } | { ok: false, reason }`. #650 consumes this function.
- Tests: green fast run and green full run each write a receipt with the right
  `policy`; failing run writes none; dirty tree is refused; downgrade request is
  refused; existing receipt is replaced; interrupted write leaves no `.json`
  file.
- Tests also change dependency bytes while holding lock metadata constant,
  change ignored `dist/` bytes while holding the Git tree constant, add/remove
  input files, redirect a symlink, exercise forbidden targets, cooperating writer exclusion and lost custody,
  and reject incomplete input declarations or absent workflow participation.
  These are required implementation witnesses, not tests supplied by this
  decision-only PR.

### #650 Receipt-validating pre-push

- `.githooks/pre-push` classifies each non-delete pushed ref with the DL-030
  classifier (the conservative full-only selector until #611), derives the
  required policy, and validates the tree with `validateReceipt`. By
  default it runs no gates.
- On any failure it exits non-zero with the ref, the tree, the required policy,
  the reason and the line `Run: npm run verify:witness`.
- Keeps the commit-pacing warning. Removes the inline DOGFOOD gating and the
  inline suite, because the witness runs the selected policy.
- Tests cover these cases: valid fast receipt for a fast change; full receipt
  for a fast change; fast receipt for a full change (rejected); missing;
  malformed; bad MAC; missing key; expired; future `completedAt`; each of
  `classificationBase`, `classification`, `installedDeps`, `generatedInputs`, `node`, `npm`,
  `platform` and `policyDigest` mismatched; a changed tracked file (new tree); a multi-ref push
  where one ref has no receipt; a delete push.
- No change to `.github/workflows/`. The DL-030 CI lanes are unchanged by this
  task.

### #651 Inline verification mode

- Enabled by `git config bijou.prepush.mode inline` (persistent per clone) or by
  `BIJOU_PREPUSH_MODE=inline` (per invocation; it overrides the config). An
  unknown value is an error, not a fallback to a weaker mode.
- In inline mode, pre-push runs the **same selected policy** as the witness,
  against each pushed tree, and ignores receipts. It writes a receipt on
  success, as a convenience for the next push. It is the existing
  long-transport behavior, made explicit.
- `inline` decides *where* the selected policy runs. To request full verification
  explicitly, run `npm run verify:witness -- --policy full` before a receipt-mode
  push. `BIJOU_FULL_PUSH` is retired and cannot alter admission.
- No mode, value or variable skips a check. The only modes are `receipt`
  (default) and `inline`.

### #652 Documentation

- Contributor documentation names `npm run verify:witness`, the receipt
  location, the 24-hour expiry, the invalidation list, the fast and full policy
  identities with a link to DL-030, and both settings for inline mode.
- Says plainly that CI is the remote authority, and that a hand-written or
  copied receipt is a hook bypass.
- Never recommends `--no-verify` or editing a receipt.
- On shared workstations, says to run the witness, and any inline-mode push,
  while holding a `bijou-prepush` semaphore slot. A receipt-mode push does not
  need a slot.
- Adds a `docs/CHANGELOG.md` entry.
