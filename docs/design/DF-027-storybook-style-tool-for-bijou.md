---
title: "DF-027 — Storybook-Style Tool for Bijou"
legend: DF
lane: design
---

# DF-027 — Storybook-Style Tool for Bijou

## Framing

Bijou already has the pieces of a Storybook-style workflow: structured
`ComponentStory` records, DOGFOOD's component explorer, story capture matrices,
fixture-promotion records, and MCP-facing docs payloads. The missing piece is a
stable workstation model that tooling can consume without scraping the full
docs app.

This cycle adds the first dedicated DOGFOOD storybook workstation slice. It is
deliberately text-first and deterministic: a model/index over every DOGFOOD
story plus a matrix capture path for any selected story. Future rich TUI,
screenshots, MCP exports, block tooling, and schema-bound controls can build on
that instead of inventing another story registry.

## Sponsored Users

- Bijou builders browsing first-party components and shells by family.
- Maintainers auditing variant and output-mode coverage before release.
- Tooling authors who need a stable story index and capture path for docs,
  MCP, screenshots, fixtures, or future block workstations.
- Agents selecting stories without reverse-engineering the DOGFOOD shell.

## Hills

1. A builder can run one Storybook-style command and see the DOGFOOD story
   catalog grouped by family, with variants, modes, packages, and sources.
2. A maintainer can capture a selected story across every variant/profile pair
   using the same `StoryCaptureMatrix` substrate as existing docs tooling.
3. A future UI or MCP tool can consume a stable workstation model instead of
   scraping `examples/docs/app.ts` or re-parsing story docs.

## Playback Questions

- Does the workstation index every DOGFOOD story without duplicating story
  truth?
- Does it group stories by family and expose variants, profile modes, package,
  tags, and source path?
- Can callers capture a selected story's variant/profile matrix?
- Does the capture path render real story previews instead of placeholder text?
- Does the tool reuse `captureStoryMatrix()` rather than creating a second
  matrix format?
- Is there a simple command for humans and agents to run?

## Requirements

- Add a DOGFOOD storybook workstation module.
- Add a text index renderer for the story catalog.
- Add a selected-story matrix capture helper.
- Reuse `ComponentStory` and `StoryCaptureMatrix` contracts.
- Add a root script for the text-first workstation.
- Keep this first slice deterministic and non-interactive; richer controls can
  build on the model later.

## Acceptance Criteria

- `tests/cycles/DF-027/storybook-workstation.test.ts` proves the cycle doc
  carries the modern playback sections.
- The workstation model covers every `COMPONENT_STORIES` entry.
- The rendered index includes family grouping, counts, variants, modes, package
  names, and source paths.
- The selected-story matrix captures every profile/variant combination and has
  no missing canonical modes for canonical DOGFOOD stories.
- The matrix output contains real rendered story content.
- `package.json` exposes `npm run storybook:index` for the deterministic
  text-first workstation, with `npm run dogfood:storybook` kept as a
  DOGFOOD-scoped compatibility alias.

## Implementation Outline

1. Add `examples/docs/storybook-workstation.ts`.
2. Export pure model/index/matrix helpers from that module.
3. Add a small CLI path that prints either the index or a selected story matrix.
4. Add a DF-027 cycle test around the model, text output, matrix capture, and
   script registration.
5. Move the backlog note into `docs/design/` and update the v6 lane pointer.

## Drift Check

The current DOGFOOD app remains the canonical human-facing docs surface. This
slice does not fork story data, add a browser dependency, or build a second TUI
shell. The workstation reads the existing `COMPONENT_STORIES` catalog and uses
the existing story protocol plus `captureStoryMatrix()`.

The result is a narrow, reusable tooling seam: deterministic enough for agents
and CI, but still powered by the same story records humans browse in DOGFOOD.

## Playback

- RED: DF-027 existed only as a backlog concept, while DOGFOOD, showcase, MCP,
  and story capture each held partial storybook-shaped behavior.
- GREEN: `createDogfoodStorybookWorkbenchModel()` produces a grouped story
  catalog from `COMPONENT_STORIES`.
- `renderDogfoodStorybookIndex()` prints counts, required modes, families,
  stories, variants, packages, and source paths.
- `captureDogfoodStorybookMatrix()` renders a selected story through every
  profile/variant pair and returns a `StoryCaptureMatrix`.
- `npm run storybook:index` provides the text-first command path, while
  `npm run dogfood:storybook` remains available for existing docs and users.

## Retrospective

The right first Storybook-style tool is not another interactive shell. It is a
stable model and capture path that makes the existing DOGFOOD stories reusable
by humans, CI, MCP, release audits, and future block tooling.
