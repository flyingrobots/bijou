# WF-122 - Cross-Platform Contributor Path

Linked issues: #122, #135, #136

Linked legend: [WF - Workflow and Delivery](../legends/WF-workflow-and-delivery.md)

## Sponsor Human

A TypeScript contributor on macOS, Linux, or Windows who wants the core Bijou
build and test path to work without first installing a Unix shell.

## Sponsor Agent

A workflow verification agent that can inspect CI, package scripts, and local
commands to prove which parts of the repo are portable and which are
intentionally platform-hosted.

## Hill

Bijou's contributor-facing scripts are Node-first, and CI proves the core build
and focused unit-test path on at least one non-Linux platform.

## Scope

- Replace avoidable Bash and POSIX shell usage in root contributor scripts.
- Add a non-Linux CI lane for build, typecheck, and focused unit tests.
- Document which workflows remain Linux/Bash-hosted because they are release,
  benchmark, or terminal-capture lanes rather than the first contributor path.

## Playback Questions

1. Can a Windows contributor run the core root scripts without WSL-only shell
   behavior?
2. Does CI prove at least one non-Linux build/typecheck/unit lane?
3. Can a reviewer tell which remaining Bash paths are intentional workflow
   infrastructure?

## Accessibility / Assistive Reading Posture

The docs must name the platform support posture plainly in README and
CONTRIBUTING without hiding it in workflow YAML.

## Localization / Directionality Posture

No runtime localization changes.

## Agent Inspectability / Explainability Posture

The proof lives in `package.json`, `.github/workflows/ci.yml`, script source,
and `workflow:shell:preflight` output.

## Linked Invariants

- Contributor-facing commands should be portable when Node can provide the same
  behavior.
- Platform-specific shell remains acceptable for release and benchmark lanes
  when the host choice is explicit.

## Decisions

- `npm run clean` becomes `node scripts/clean.mjs` and removes workspace
  `dist/` directories plus workspace `.tsbuildinfo` files without shell globs.
- `npm run version` becomes `node scripts/version.mjs`, preserving the existing
  workspace version bump and internal dependency pinning behavior.
- CI keeps the full Node 18/20/22 lane on Ubuntu and adds Node 22 focused unit
  coverage on macOS and Windows.
- Existing release, publish, benchmark, retry, and hook shell scripts remain
  explicit shell-owned infrastructure. They are not the Day 0 contributor path.

## Verification

- `node --check scripts/clean.mjs`
- `node --check scripts/version.mjs`
- `npm run workflow:shell:preflight`
- focused CI-equivalent unit tests listed in `.github/workflows/ci.yml`

## Tests To Write First

- Script syntax checks for converted Node scripts.
- Workflow shell preflight after changing CI.

## Retrospective

See [WF-122 day zero audit fixes](../method/retro/WF-122-day-zero-audit-fixes.md).
