---
title: DF-072 DOGFOOD Release Title Artifact Gallery
legend: DF
lane: cool-ideas
priority: medium
issue: https://github.com/flyingrobots/bijou/issues/289
keywords:
  - dogfood
  - release
  - release-title
  - title-gallery
---

# DF-072 DOGFOOD Release Title Artifact Gallery

## Framing

Issue #289 asks DOGFOOD to treat release title screens as first-class release
artifacts instead of replacing the last title treatment in place. V7 shipped
with `V7 Product Truth`; this follow-up adds a unique post-release treatment
and keeps both artifacts visible through the Release page.

The design follows a Design Thinking loop: observe that release identity is
valuable after the release lands, frame titles as reusable proof artifacts,
prototype a gallery that keeps the newest treatment first, and prove every
title through interactive, static, pipe, accessible, and localized output.

## Sponsor Human

- A maintainer reviewing the release wants to see that v7 was published and
  that follow-up work is intentionally tracked instead of silently changing the
  historical title.
- A DOGFOOD reader wants the Release page to open with the current title while
  still making the original release title discoverable.

## Sponsor Agent

- A review agent needs release-title metadata, lower-mode facts, and
  localization keys in one typed structure instead of scattered prose.

## Hill

A DOGFOOD reader can open the Release guide and see a latest-first title
gallery whose current item is a unique `V7 Launch Wake` post-release title
screen, while the original `V7 Product Truth` artifact remains available with
its own lower-mode facts.

## Playback Questions

- Does the Release guide open with the current title treatment?
- Does the historical `V7 Product Truth` artifact remain selectable?
- Do static, pipe, and accessible modes all lower from the same typed
  release-title record?
- Does every new visible string have source rows and generated catalogs for
  all supported DOGFOOD locales?
- Does compact interactive rendering stay within the caller's requested width?

## Current Truth

- `v7.0.0` is already published.
- The strict `v7.0.0` GitHub milestone has no open issues.
- Issue #289 is open in the Beyond milestone and already describes the gallery
  shape this patch should land.
- DOGFOOD currently has one release-title metadata object, one Release guide,
  and localized strings for that single title.

## Product Shape

### Release Page Gallery

```text
DOGFOOD Release

> V7 Launch Wake        v7-launch   current
  A released line leaves a readable trail.
  lanes: published release | follow-up patch | title gallery | green main CI

  V7 Product Truth      v7          historical
  Blocks prove product surfaces. DOGFOOD proves Blocks.
  lanes: table parity | scoped Node I/O | BlockLab | release title
```

### Current Title

```text
+ BIJOU DOGFOOD -------------------------------------------+
| V7 Launch Wake                                           |
| A released line leaves a readable trail.                 |
|                                                          |
| Proof lanes: published release | follow-up patch | ...   |
| Release gate: v7.0.0 released, patch lane open           |
| Motif: Wake lines, not fireworks: proof remains visible  |
|                                                          |
| [Release Notes] [Migration] [DOGFOOD] [BlockLab]         |
+----------------------------------------------------------+
```

### Narrow Title

```text
+ BIJOU DOGFOOD ----+
| V7 Launch Wake    |
| Release trail.    |
| lanes: published  |
| gate: v7.0.0 ...  |
| motif: wake lines |
+-------------------+
```

## Lower Modes

Static mode keeps the title useful without border art:

```text
Bijou DOGFOOD release title. Release V7 Launch Wake.
Proof lanes: published release, follow-up patch, title gallery, green main CI.
Motif: Wake lines, not fireworks: proof remains visible after ship.
```

Pipe mode exposes facts for agents:

```text
release_id	v7-launch
release_title	V7 Launch Wake
release_motif	Wake lines, not fireworks: proof remains visible after ship.
proof_lane	published release
proof_lane	follow-up patch
proof_lane	title gallery
proof_lane	green main CI
navigation_available	true
```

Accessible mode names the same proof without depending on layout:

```text
DOGFOOD title screen for V7 Launch Wake.
Current release proof lanes are published release, follow-up patch,
title gallery, green main CI.
Visual motif: Wake lines, not fireworks: proof remains visible after ship.
Navigation remains available after the title.
```

## Runtime And API Contract

- Release-title data is represented by typed `DogfoodReleaseTitle` records.
- `DOGFOOD_RELEASE_TITLE_GALLERY` is latest-first.
- `CURRENT_DOGFOOD_RELEASE_TITLE` points at the current title treatment.
- Rendering defaults to the current title but accepts an explicit historical
  title for stable artifact playback.
- DOGFOOD Release guides are generated from the gallery, not manually copied
  per title.

## Linked Invariants

- New release-title UI strings must be represented in every supported DOGFOOD
  locale.
- Lower modes must expose the same release id, title, motif, proof lanes, and
  navigation availability as the interactive title.
- Release-title rendering must stay deterministic and width-bounded from its
  explicit inputs.

## Accessibility, Localization, And Inspectability

- Every visible string added in this cycle has `en`, `de`, `es`, and `fr`
  source rows and regenerated runtime catalogs.
- The title's motif is exposed as text in interactive, static, pipe, and
  accessible modes.
- The renderer remains deterministic and does not query GitHub, wall-clock
  time, or release APIs.
- Interactive output must stay inside the requested width for compact
  terminals.

## Tests To Write First

- Extend `tests/cycles/DF-060/v7-dogfood-release-title-screen.test.ts`.
- RED state:
  - no `CURRENT_DOGFOOD_RELEASE_TITLE`
  - no `DOGFOOD_RELEASE_TITLE_GALLERY`
  - no `v7-launch` lower-mode facts
  - Release page still exposes only `release-title-v7`
- GREEN state:
  - the gallery is latest-first
  - `V7 Launch Wake` is the current title
  - `V7 Product Truth` remains available as a historical guide
  - pipe output includes `release_id` and `release_motif`

## Acceptance Criteria

- Issue #289 is closed by the PR.
- DOGFOOD has a unique post-release title screen for `v7.0.0`.
- The original v7 title treatment remains inspectable.
- Runtime catalogs are regenerated from source.
- The changelog records the follow-up.

## Risks And Guardrails

- Do not rewrite the release history or imply that #289 was part of the strict
  `v7.0.0` milestone.
- Do not make the title gallery a live GitHub integration.
- Do not remove existing V7 title metadata or tests.
