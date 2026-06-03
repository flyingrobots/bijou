# What's New in Bijou 7.0.0

Bijou 7.0.0 ships the V6 layout floor and the V7 Product Truth lane as one
release boundary. The short version: frame geometry, standard Blocks, DOGFOOD
docs truth, localization posture, release proof, and notification polish now
live on firmer public contracts instead of scattered demo-specific wiring.

## Product Truth Is Block-Owned

DOGFOOD now routes its release-facing docs surface through named Block
contracts. The docs workspace, navigation, documentation article, guide
inspector, settings menu, BlockLab workbench, title screen, footer hints, frame
search, notifications, performance HUD, keyboard help, command palette, and
surface inventory all have inspectable semantic contracts.

That matters because product behavior is no longer only visible as pixels. A
reviewer or agent can inspect metadata, schema-bound inputs, command intents,
lower-mode facts, and rendered output for the same surface.

## The Standard Block Catalog Is Broader

The release expands first-party Blocks across the DOGFOOD component families:

- grouping, explainability, document, destination, divider, and text-entry
  Blocks
- single-choice, multiple-choice, binary-decision, peer-navigation,
  progressive-disclosure, and path-progress Blocks
- brand-emphasis, mode-aware primitive, dense comparison, hierarchy,
  exploration-list, and temporal-dependency Blocks
- status and feedback Blocks for inline status, in-flow status, transient
  overlays, activity streams, shortcut cues, and progress indicators

Each family lands with public metadata, schema adapters, command-intent
posture, visual/static rendering, lower-mode output, and stable semantic facts.

## Layout, Tables, And Selection Got Stricter

The V6 floor brings pure layout envelope primitives to `@flyingrobots/bijou`:
immutable constraints, preferences, assigned rectangles, direction, fit policy,
content measurement seams, parent-owned assignment, minimal stack/place
resolution, and explanation facts.

Table rendering also moves to a more honest bounded-width model:

- `table()` fits human-mode output to the available terminal width by default
- `tableSurface()` matches that bounded-width posture for surface rendering
- wrapped cells preserve word boundaries when possible
- intrinsic layout remains available as an explicit opt-in
- pipe lowerings now cover TSV, CSV, Markdown, and ASCII grid

Selection and copy are now pure retained-geometry primitives: selection owners,
viewport-aware ranges, semantic prose/surface/table extraction, mixed-region
ordering, blocker arbitration, terminal-native fallback, and clipboard-effect
records without hidden OS clipboard side effects.

## Localization And DOGFOOD Are More Honest

`@flyingrobots/bijou-i18n` now exposes a structured localization port with
immutable localized objects, fallback and missing metadata, issue facts, and
explicit resource/data behavior. DOGFOOD routes ordinary docs text lookup
through that port, persists locale preference through host-owned storage, and
keeps catalog completeness under local and CI gates.

The DOGFOOD app also gained a release identity and release-title proof surface
for V7 Product Truth, plus clearer package, philosophy, architecture, doctrine,
guide, and release documentation inside the terminal docs reader.

## Runtime And Workflow Proof Tightened

This release hardens operator-facing surfaces:

- command backpressure diagnostics and async render middleware diagnostics are
  exposed in `@flyingrobots/bijou-tui`
- DOGFOOD and docs smoke paths have tighter non-interactive guardrails
- CI can skip expensive DOGFOOD-only gates for unrelated pull-request paths
  while still running the full proof path on `main` and tags
- GitHub comment workflow docs now require file-backed Markdown comments so
  commands, backticks, and tables survive review automation

## Notification Text Wraps Like Human Prose

The live `@flyingrobots/bijou-tui` notification stack now wraps title, body,
and action rows at word boundaries when possible instead of splitting ordinary
words in the overlay. Long unbroken words still hard-wrap so notifications
cannot exceed their assigned width.

This is the fix Jedit needs for normal-mode runtime feedback: the notification
surface stays readable without giving up bounded terminal layout.

## Compatibility

Bijou 7.0.0 is a major release because it publishes a broader product-truth
surface and tighter runtime contracts. Apps using the documented public APIs
should see the upgrade mostly as new capability, but maintainers should read
the migration guide before bumping because table fitting, Block exports, and
release-proof DOGFOOD behavior are intentionally stricter than the 5.0.0 line.
