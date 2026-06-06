# Release Packets

Release packets are Bijou's roadmap planning surface. GitHub milestones and
issues remain the live tracker; release packets explain how those tracker items
compose into release promises, goalposts, slices, and proof.

## Purpose

Bijou uses a roadmap-driven, issue-backed, slice-budgeted delivery system.

The system separates intent, coordination, execution, and proof:

- Markdown documents define intent, scope, contracts, and acceptance criteria.
- GitHub Issues coordinate goalposts, user stories, labels, ownership, and
  tracker state.
- Branches, commits, and pull requests execute reviewable changes.
- Tests, DOGFOOD witnesses, generated artifacts, command output, and runtime
  facts prove implementation.

A design document may define intent, but it does not prove implementation. A
goalpost is complete only when the repo can prove the claimed behavior through
an executable or inspectable software surface.

## System Model

| Entity | Purpose | Location |
| :--- | :--- | :--- |
| Roadmap | Orders release horizons | `docs/ROADMAP.md` |
| Versioned Release | SemVer product target | `docs/method/releases/vX.Y.Z/` |
| Release Gate | Release completion checklist | Release packet |
| Goalpost | Major milestone inside a release | Goalpost doc and umbrella issue |
| Umbrella Issue | Goalpost tracking root | GitHub issue with goalpost role |
| User Story | User-centered behavior | Child issue and goalpost section |
| Slice | Reviewable increment | Goalpost checklist |
| Slice Budget | Planning denominator | Roadmap, goalpost doc, issue body |
| Acceptance Criteria | Completion contract | Docs and issue bodies |
| Validation Plan | Required proof commands | Design docs and PR bodies |
| Pull Request | Review and merge vehicle | GitHub PR |
| Changelog Entry | Historical ledger | `docs/CHANGELOG.md` |

The planning-to-merge path is:

```text
Roadmap doc
  -> versioned release packet
    -> goalpost doc
      -> umbrella issue
        -> child user-story issues
          -> slices
            -> commits
              -> pull request
                -> merge
```

## Versioned Release

A Versioned Release is a bounded product target with a leading-`v` SemVer
identifier:

```text
vMAJOR.MINOR.PATCH
```

Use a versioned release when the work has a release-level definition of done.
Do not create a new version for every feature. Feature work belongs inside the
current active version unless it changes the release promise.

```text
VersionedRelease = {
  id: "vX.Y.Z",
  name: string,
  roadmapDoc: MarkdownDocument,
  goalposts: Goalpost[],
  releaseGate: ChecklistItem[],
  totalSliceBudget: PositiveInteger,
  status: "planned" | "active" | "landed" | "superseded"
}
```

## Release Gate

A Release Gate is the checklist that must be true before a version can be
called landed. Release gates should reference executable or inspectable proof:
tests, DOGFOOD routes, lower-mode output, schema checks, CI commands, generated
artifacts, or release-readiness commands.

Release-gate examples:

- Runtime and public API behavior is covered by focused tests.
- DOGFOOD exposes the shipped behavior as a canonical docs surface.
- Localized visible strings exist for every supported locale.
- `npm run release:readiness` and required CI checks are green.
- `docs/CHANGELOG.md`, `docs/BEARING.md`, and `docs/ROADMAP.md` reflect the
  release state.

## Goalpost

A Goalpost is a major milestone inside a versioned release. It is larger than a
single implementation issue and smaller than a whole release.

```text
Goalpost = {
  id: "V<major>-GP<n>",
  title: string,
  umbrellaIssue: GitHubIssue,
  designDoc: MarkdownDocument,
  sliceBudget: PositiveInteger,
  userStories: UserStory[],
  checklist: Slice[],
  acceptanceCriteria: ChecklistItem[],
  validationPlan: CommandOrWitness[],
  completionState: "planned" | "active" | "landed" | "superseded"
}
```

A goalpost must answer:

- What user or agent outcome does this milestone unlock?
- What inspectable contract exists?
- What is explicitly in scope?
- What is explicitly out of scope?
- Which stories make up the goalpost?
- How many slices are budgeted?
- What must be true before the goalpost is done?
- What tests, witnesses, generated artifacts, or facts prove it?

## Umbrella Issue

An Umbrella Issue tracks one goalpost. It owns the goalpost checklist and links
child User Story Issues. Its body should link the goalpost doc, release packet,
and active PRs.

Umbrella issues should use:

- roadmap role: `Goalpost umbrella`
- `lane:release` when the goalpost is committed to a release
- a versioned milestone when the goalpost has a release target
- `work-in-progress` only while a branch or PR is actively carrying it

## User Story Issue

A User Story Issue represents one behavior, workflow, or capability under a
goalpost.

```text
UserStory = {
  issue: GitHubIssue,
  actor: "user" | "agent" | "maintainer" | "designer-engineer",
  need: string,
  reason: string,
  proof: ChecklistItem[],
  sliceBudget: PositiveInteger
}
```

A well-formed story uses this shape:

```text
A <type of user> wants <capability/outcome> so that <reason>,
without having to <current workaround or failure mode>.
```

Intent alone is not enough. A user story must name proof.

## Slice Budget

A Slice is the smallest useful execution unit. A good slice can usually be
reviewed independently and has one obvious proof.

```text
Slice = {
  number: PositiveInteger,
  description: string,
  expectedProof: "test" | "witness" | "docUpdate" | "issueUpdate" | "runtimeBehavior",
  status: "open" | "inProgress" | "complete"
}
```

Slice budgets provide progress denominators:

```text
GoalProgress = completed slices / total slices
OverallProgress = landed goalposts / total goalposts
```

Progress reports should use concrete denominators:

```text
Runtime Graph IR (slice 3 of 12) [###-------] 25%
```

## Proof Policy

No implementation goalpost is complete through documentation alone.

Acceptable proof includes:

- unit tests against runtime modules
- fixture-table tests
- DOGFOOD scripted app flows
- lower-mode static, pipe, or accessible output
- generated artifact checks
- schema validation
- deterministic command output
- CI checks
- accessibility and focus witnesses
- inspectable app facts

Docs can explain the contract. They cannot be the only evidence that the
contract works.

## Label Model

Labels are query indexes, not prose decoration.

| Label | Meaning |
| :--- | :--- |
| `lane:inbox` | Raw intake that still needs triage or shaping. |
| `lane:asap` | Imminent work to pull into the next cycle. |
| `lane:bad-code` | Technical debt or structural risk. |
| `lane:cool-ideas` | Uncommitted experiments and optional explorations. |
| `lane:release` | Release-boundary shaping or blockers. |
| `roadmap` | Participates in roadmap planning. |
| `goalpost` | Umbrella milestone issue for a roadmap goalpost. |
| `user-story` | Child issue scoped to one user story under a goalpost. |
| `work-in-progress` | Current active implementation cycle. |
| `needs-design` | Missing Method design artifact. |
| `needs-witness` | Missing reproducible witness evidence. |
| `needs-retro` | Missing closeout or retro evidence. |

The issue form captures roadmap role as structured prose, and maintainers or
agents apply the matching query labels during triage. The important invariant
is that `goalpost` and `user-story` should not be mixed casually: umbrella
issues get `goalpost`; child story issues get `user-story`.

## Authority Model

Authority flows in this order:

1. Runtime behavior and saved/rendered output.
2. Tests, DOGFOOD witnesses, schema checks, generated artifacts, and command
   output.
3. GitHub Issues and pull requests.
4. Design docs and roadmap docs.
5. Changelog entries.
6. Coordination memory.

Memory notes help coordination, but they do not override files, commits,
commands, GitHub Issues, pull requests, tests, or generated output.

## Operating Invariants

- Every versioned release has a roadmap entry.
- Every versioned release uses leading-`v` SemVer: `vMAJOR.MINOR.PATCH`.
- Every release-scale milestone has a goalpost Markdown document.
- Every goalpost has one umbrella GitHub issue.
- Every umbrella issue collects child user-story issues as task-list items.
- Every child issue maps to a user story, not a vague task.
- Every goalpost has a slice budget.
- Every goalpost doc has a checklist.
- Runtime and product work must have executable proof.
- Markdown docs are planning artifacts, not proof artifacts.
- Branches, commits, and PRs do not use a `codex` prefix.
- PRs are non-draft unless repo policy changes.
