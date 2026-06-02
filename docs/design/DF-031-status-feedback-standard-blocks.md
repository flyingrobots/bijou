---
title: DF-031 Status and feedback standard Blocks
legend: DF
lane: design
priority: medium
keywords:
  - blocks
  - component-audit
  - dogfood
  - lowerings
  - status-feedback
---

# DF-031 Status and feedback standard Blocks

## Framing

The v6 block floor already proved `AppShell`, `ReaderSurface`, and
`InspectorPanel`. The next useful slice is the product feedback layer:
inline state, in-flow notices, transient overlays, activity history, shortcut
cues, and progress.

This cycle turns issues #220 through #225 into first-party standard Blocks in
`@flyingrobots/bijou`. The work uses the current typed Blocks API:
`defineBlock()`, validated metadata, view data contracts, command intents,
story ids, deterministic render output, and stable lowering facts. It does not
introduce a new YAML or JSON runtime IR. Declarative YAML/JSON can become an
adapter later, but it should compile into the typed contract this slice proves.

## Sponsored Users

- TUI app authors who need reusable status and feedback semantics instead of
  bespoke strings inside pages.
- DOGFOOD maintainers who need status surfaces to lower truthfully across
  interactive, static, pipe, and accessible modes.
- Tooling authors who want block metadata, data contracts, command intents,
  and stories to describe feedback surfaces before rendering them.
- Future IR authors who need a typed target for YAML/JSON block declarations.

## Hills

1. A builder can import one of the standard feedback Blocks and immediately
   inspect its metadata, data requirements, command intents, and ready story.
2. A reader can move between rich, static, pipe, and accessible profiles and
   still get the same feedback meaning, even when visual chrome disappears.
3. A maintainer can run one focused cycle test that proves the status and
   feedback slice is catalogued, rendered, and lowering-stable.

## Playback Questions

- Which feedback surfaces are common enough to become first-party Blocks now?
- Do these Blocks declare data contracts and command intents without taking on
  provider subscriptions or command dispatch?
- Do visual modes render as surfaces while pipe and accessible modes preserve
  meaning as text?
- Do lowerings carry stable facts so tests and tools do not parse terminal
  drawings?
- Does this slice make room for a future YAML/JSON declaration format without
  inventing a second runtime contract?

## Block Set

| Issue | Block | Purpose |
| :--- | :--- | :--- |
| [#220](https://github.com/flyingrobots/bijou/issues/220) | `InlineStatusBlock` | Small local status beside an item, field, row, or command. |
| [#221](https://github.com/flyingrobots/bijou/issues/221) | `InFlowStatusBlock` | Notice or state message that lives in document flow. |
| [#222](https://github.com/flyingrobots/bijou/issues/222) | `TransientOverlayBlock` | Temporary shell-level feedback that should still lower to text. |
| [#223](https://github.com/flyingrobots/bijou/issues/223) | `ActivityStreamBlock` | Ordered recent events with optional active selection. |
| [#224](https://github.com/flyingrobots/bijou/issues/224) | `ShortcutCueBlock` | Inline shortcut hints scoped to a page, region, or command. |
| [#225](https://github.com/flyingrobots/bijou/issues/225) | `ProgressIndicatorBlock` | Determinate or named progress state with stable facts. |

## TUI Mockups

Inline status:

```text
+-- InlineStatusBlock ----------------------+
| label: docs                               |
| status: ok                                |
| message: synced                           |
+-------------------------------------------+
```

In-flow notice:

```text
+-- InFlowStatusBlock ----------------------+
| severity: warning                         |
| source: docs                              |
| message: inventory stale                  |
| action: run docs:inventory                |
+-------------------------------------------+
```

Transient overlay:

```text
+-- TransientOverlayBlock ------------------+
| priority: normal                          |
| message: Saved DOGFOOD route              |
| dismiss: Esc dismisses                    |
+-------------------------------------------+
```

Activity stream:

```text
+-- ActivityStreamBlock --------------------+
| events: 10:41 tests passed                |
|         10:42 PR opened                   |
| selected: 10:41 tests passed              |
+-------------------------------------------+
```

Shortcut cues:

```text
+-- ShortcutCueBlock -----------------------+
| shortcuts: / Search                       |
|            ? Help                         |
|            Esc Close                      |
| scope: page                               |
+-------------------------------------------+
```

Progress:

```text
+-- ProgressIndicatorBlock -----------------+
| label: Install packages                   |
| value: 3                                  |
| total: 5                                  |
| percent: 60%                              |
+-------------------------------------------+
```

## Lower Modes

Static mode preserves the same surface structure as interactive mode while
remaining deterministic and render-only.

Pipe mode lowers every Block to a compact record:

```text
InlineStatusBlock | label=docs | status=ok | message=synced
```

Accessible mode lowers every Block to a readable sentence list:

```text
InlineStatusBlock
- label: docs
- status: ok
- message: synced
```

The lower-mode invariant is semantic parity, not visual parity. Pipe and
accessible consumers should not need box drawing, row positions, or color to
understand status.

## Requirements

- Export all six Blocks from the package barrel and standard catalog.
- Include all six Blocks in `standardBlockPackageManifest`.
- Give each Block valid metadata across interactive, static, pipe, and
  accessible modes.
- Give each Block at least one ready story id.
- Attach view data contracts so tooling can inspect required slot data without
  provider handles.
- Attach command intents for selecting the block, copying facts, and opening a
  story, without command callbacks.
- Render interactive/static output as surfaces and pipe/accessible output as
  text.
- Preserve `block` and `block.rendered` facts across modes.

## Acceptance Criteria

- `tests/cycles/DF-031/status-feedback-blocks.test.ts` proves the six Blocks
  publish through the standard catalog and package manifest.
- The cycle test validates metadata and command intent shape for every Block.
- The cycle test renders every Block in every canonical mode.
- The cycle test verifies lowerings remain fact-stable.
- Existing DX-031 standard block tests expand their catalog expectations from
  three Blocks to nine Blocks.
- Repo docs stop describing this catalog expansion as future v7 work.

## Implementation Outline

1. Add a RED cycle test for issues #220 through #225.
2. Extend `BlockScale` to support the product scales needed by this slice:
   `inline` and `overlay`.
3. Add six standard Block definitions in `standard-blocks.ts`.
4. Register their stories, metadata, data contracts, command intents, and
   package manifest entries.
5. Reuse the existing section renderer pattern so visual and lower modes stay
   deterministic.
6. Update BEARING, ROADMAP, CHANGELOG, v6 backlog evidence, design-system
   docs, and package docs.

## Future Declarative Shape

The old Bijou IR idea still fits, but this slice keeps it as a declaration
format over the typed API:

```yaml
block: InlineStatusBlock
package: "@flyingrobots/bijou"
story: inline-status.ready
modes:
  - interactive
  - static
  - pipe
  - accessible
data:
  inlineStatus.label: docs
  inlineStatus.status: ok
  inlineStatus.message: synced
commands:
  - inlineStatus.select
  - inlineStatus.copyFacts
  - inlineStatus.openStory
```

A future adapter can parse this shape, validate it, and build typed
`BlockDefinition` input or story fixtures. The runtime source of truth remains
the typed Block contract.

## Drift Check

The original DX-031 release floor was correct to limit itself to the first
three Blocks. Drift appeared later when issues #220 through #225 became clear
v6 candidates but ROADMAP and BEARING still left them in the v7 queue. This
cycle corrects the tracker mirror and makes the expansion explicit,
issue-backed v6 work.

No new follow-on debt is deferred by this slice. Broader component-family
audits remain separate issues after #225.

## Playback

- RED: the status/feedback cycle test imported six standard Blocks that did
  not exist yet and failed at module load.
- GREEN: `@flyingrobots/bijou` now exports `InlineStatusBlock`,
  `InFlowStatusBlock`, `TransientOverlayBlock`, `ActivityStreamBlock`,
  `ShortcutCueBlock`, and `ProgressIndicatorBlock`.
- The six Blocks are in `standardBlocks`, `standardBlockStories`, and
  `standardBlockPackageManifest`.
- Interactive/static modes produce surfaces; pipe/accessibility modes produce
  semantic text.
- Stable lowering facts are present across all modes.

## Retrospective

The useful move was not to invent a new IR under pressure. The useful move was
to land the feedback vocabulary as typed, tested Blocks, then leave YAML/JSON
as a future authoring adapter. That keeps the v6 release boundary concrete:
geometry and Blocks continue to be inspectable package truth, not untyped
story prose.
