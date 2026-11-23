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

Use a supported Node.js version and a running Docker daemon. Local shared
workers require `git-locks` and the workstation's registered Docker resource
keys. The initial Linux toolchain uses a pinned Node 22 Bookworm image.
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

## Inspect results

The launcher prints the path to its evidence directory. Admission and completion
receipts record the copied source, image, limits, exit status and observed
resource usage. A started worker or a printed admission record is not a pass.
Only a completed run with a successful exit status establishes test success.

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
