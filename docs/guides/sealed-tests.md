# Run tests in a disposable Docker copy

Bijou tests must run inside Docker, including tests launched by Git hooks, CI,
smoke harnesses and release witnesses. The launcher copies the input files and
independent Git objects into the container. It never mounts the host checkout.
The copied repository has no remotes, external object store or linked-worktree
pointer. Test fixtures may change that disposable repository without changing
the source repository.

Implementation and validation evidence are recorded in
[issue #750](https://github.com/flyingrobots/bijou/issues/750).

## Prepare the toolchain

Use a supported Node.js version and a running Docker daemon. Nothing else is
required: the scripts invoke no lock tool. The initial Linux toolchain uses a
pinned Node 22 Bookworm image.

One sealed run uses the local worker at a time. The worker container has a
fixed name, and a second run started while it is active is refused at once
with `Worker already active`; it does not wait. Run it again when the first
finishes. A caller that wants runs to queue, such as several agents sharing a
workstation, wraps its own command in a lock of its choosing, for example
`git locks with --job "seal-$$" --holder "${USER:-me}" --wait 600 <key> -- npm test` where
[git-locks](https://github.com/git-stunts/locks) is installed. That is the
caller's choice and never the repository's requirement.
Bootstrap refuses an absent base image instead of downloading it without
resource admission.

Local execution uses Linux containers, including on macOS through Docker.
The native Windows lane uses disposable Windows containers on GitHub-hosted
Windows runners; the Windows launcher currently requires that CI environment.

```sh
node scripts/docker-seal/bootstrap.mjs --node-version 22
```

Bootstrap adds only a seal marker to the toolchain image. Project source,
dependencies and completed builds are not baked into that image.

## Execute a test

```sh
npm test
npm run test:run -- scripts/frame-assertions.test.ts
npm run test:frames
```

These commands build inside the container before running tests. `test:run`
preserves the existing focused/full runner semantics. Each invocation takes a new source
snapshot; edits to the host checkout do not appear in a running container.
`test:watch` currently runs one sealed snapshot because the worker sets `CI=true`;
it does not watch host edits. Repeat a focused command after editing. Live watch
support requires a launcher that refreshes copies; a host bind mount is not an
acceptable substitute.

For a compound validation, run the commands in one copied environment:

```sh
node scripts/docker-seal/run.mjs -- sh -c 'npm run build && npm run lint && npm run test:run'
```

Package downloads happen in a separate bounded setup worker that receives only
package manifests, the lockfile, and the repository tarballs the lockfile
resolves with `file:` (the vendored Geordi packages of `examples/web-gpu`,
listed by `scripts/docker-seal/local-tarballs.mjs`). npm checks each tarball
against its lockfile `integrity`. Package lifecycle scripts are disabled
there. Tests and lifecycle execution run afterward with networking disabled.
Missing offline dependencies fail the run; the launcher does not restore
network access as a fallback.

### Run one shard of the full suite

`npm run test:run` with no file runs every test file, in chunks of 48 files,
one chunk after another. `BIJOU_VITEST_SHARD=k/n` runs the k-th of n shares of
those chunks: shard k takes every n-th chunk, so the n shards together run
every file once. CI runs the suite as four shards on four runners, for each
Node version.

```bash
node scripts/docker-seal/run.mjs -- sh -c 'npm run build && BIJOU_VITEST_SHARD=2/4 npm run test:run'
```

The run's first line names the share, in the form `vitest shard 2/4: 6 of 25 chunks,
288 of 1159 files` (illustrative counts). A value that is not `k/n` with
`1 <= k <= n` is refused with exit status 2. With the variable unset the whole
suite runs, as before.

## Inspect results

The launcher prints the path to its evidence directory. Admission and completion
receipts record the copied source, image, limits, exit status and observed
resource usage. A started worker or a printed admission record is not a pass.
Only a completed run with a successful exit status establishes test success.

While the command runs, the Linux supervisor samples the bytes written under
`/work`, `/tmp`, `/dev/shm` and the test user's home directory every 250 ms by walking those
trees, and stops the workload with exit status 2 when a limit is reached or
the measurement itself fails. A directory that the workload removes during a
walk, such as a test's temporary Git repository, counts as empty. A
measurement failure is reported as `Sealed supervisor stopped the workload:
its generated-byte measurement failed, not a test: ...`; the workload's own
result is not established by such a run.

Explicit `--export` requests copy ordinary artifact files into the evidence
directory. Exports reject symlinks, traversal and repository internals. They do
not overwrite source files. A container's changed working tree is disposable.

## Boundaries and failure handling

The `@git-stunts/docker-guard` package is paired with actual container checks.
`GITHUB_ACTIONS` or `GIT_STUNTS_DOCKER=1` alone never grants admission.
Linux workers use a read-only root, bounded temporary filesystems, private
processes and networking, and no Docker socket or host mounts. CPU, memory,
process, output and runtime limits remain active while commands execute.

Windows workers run as `ContainerUser` with process isolation, no host mounts,
and no network while tests execute. Their storage limits differ from the Linux
limits, and each has a different strength:

| Limit | Value | Kind |
| --- | --- | --- |
| Worker volume | at most 20 GiB | Hard. The volume refuses writes when it is full. The launcher measures the capacity in each worker and refuses a larger volume. |
| Data budget | 4 GiB | Sampled. The launcher stops the run when it observes more growth than this since the worker started. |
| Generated-data budget | 40 MiB | Sampled. The same observation, counted from the end of the offline dependency installation. |
| Host free space | 50 GiB floor | Sampled. The launcher stops when the filesystem that holds Docker storage has less free space. |

A sampled budget charges the larger of two observations: growth of used space
on the worker volume, and decreases of free space on the host filesystem that
holds Docker storage. It can miss use that happens between two samples, and the
host figure also counts other activity on that filesystem. The receipts record
these limits under `storage`.

Windows workers have no per-account disk quota: GitHub-hosted Windows runners
refuse to set or read quota entries for a container. The launcher requests a
20 GB worker volume, which is the smallest that Docker gives a Windows worker,
and refuses a worker with any other storage setting. On hosted runners a
smaller request still gave a 21,339,549,696 byte volume (job 135323118345), and
no request gave a 136,229,920,768 byte volume (job 135334072019).

The Git copy intentionally retains repository history and staged blobs for
base-sensitive and staged-file checks. Host Git configuration, credential
stores and ignored local inputs are not copied. This is not a claim that
historical repository content has been scanned for secrets.

When shutdown cannot be verified, the launcher retains a quarantine marker and
refuses reuse. Inspect the recorded worker and establish that its writers have
stopped before recovering it. Lease expiry alone does not establish that fact.
Never bypass admission, attach the source checkout, or run the failed test on
the host to obtain a passing result.

## The one suite outside the seal

The browser suite of `examples/web-gpu` (`npm run test:browser:web-gpu`) does not
run in the sealed runner. The sealed workers have no browser and no GPU, and the
suite's job is to show that the built showcase renders, takes input and recovers
in a real Chrome. It runs on a developer machine and in the CI job "Browser Suite
(web-gpu, Chrome)". It is the only exception to the rule that all tests run
sealed, and `AGENTS.md` records it.

The showcase's build and typecheck, and every test that does not need a browser,
still run in the seal. `tests/web-gpu/ci-browser-job.test.ts`, which runs sealed,
holds the CI job to installing the locked dependencies and running the suite.
See [`examples/web-gpu/README.md`](../../examples/web-gpu/README.md) for the
commands and for what each run does and does not show.
