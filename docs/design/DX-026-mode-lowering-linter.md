---
title: DX-026 Mode-Lowering Linter
legend: DX
lane: design
---

# DX-026 Mode-Lowering Linter

## Framing

Bijou treats `interactive`, `static`, `pipe`, and `accessible` as real output
contracts, not skins. Rich output can use layout, color, borders, animation, and
symbols, but lower modes still need to preserve the semantic truth a human or
agent needs to understand the component.

DX-026 adds a pure diagnostic helper for mode-lowering fidelity. The first slice
does not parse rendered text or own component rendering. Instead, component
authors supply the semantic facts each mode promises to preserve, and Bijou
reports missing or collapsed facts in a stable format.

## Sponsored Users

- Component authors proving a custom component lowers honestly.
- Maintainers reviewing regressions in `pipe` and `accessible` output.
- Agent workflows that need deterministic diagnostics instead of screenshots.

## Hills

1. A component author can compare semantic facts across rich, static, pipe, and
   accessible outputs without matching visual text.
2. A maintainer can identify which mode dropped a required entity, count,
   state, label, edge, or custom fact.
3. A test can assert a compact report, then render that report as stable text
   for docs or review comments.

## Playback Questions

- Can a caller define a baseline mode and compare every other mode to it?
- Does the helper report missing facts per mode with fact kind and key?
- Does the helper report changed fact values for counts, states, or other
  value-bearing facts?
- Does the helper report collapsed duplicate facts inside a mode?
- Can callers mark a fact as optional so intentional omissions do not warn?
- Can callers add component-specific assertion results to the same report?
- Does `@flyingrobots/bijou` export the helper and its report types?

## Requirements

- Add `lintModeLowering(options)` to `@flyingrobots/bijou`.
- Add `modeLoweringReportText(report)` for deterministic diagnostics.
- Support fact kinds for `entity`, `edge`, `count`, `label`, `state`, and
  `custom`.
- Treat baseline facts as required unless `required: false`.
- Report missing required baseline facts in lower modes.
- Report changed required fact values in lower modes.
- Report duplicate fact keys inside a mode as collapsed semantics.
- Accept custom assertion results so component tests can attach domain-specific
  failures without a second reporting format.

## Acceptance Criteria

- RED tests fail before implementation and pass after.
- Reports include checked modes, issue severities, fact keys, and messages.
- Optional facts are ignored when absent from a lower mode.
- Duplicate facts are reported deterministically.
- Docs and changelog describe the helper.

## Implementation Outline

- Implement the helper in `packages/bijou/src/core/mode-lowering.ts`.
- Export it from `packages/bijou/src/index.ts`.
- Keep the API pure and string/symbol independent; semantic facts are explicit
  runtime objects supplied by callers.

## Drift Check

- Scope narrowed from a static source-code linter to a pure semantic diagnostic
  helper. That is the right first slice because components already know their
  runtime semantic facts, while parsing rendered text or source files would add
  brittle inference.
- The helper reports missing facts, changed fact values, duplicate facts, and
  custom assertion failures. It does not try to decide whether a glyph or phrase
  is visually equivalent.
- `interactive` is the default baseline when present; otherwise the first
  supplied mode becomes the baseline.

## Playback

- `lintModeLowering()` compares supplied mode facts against a baseline and
  returns a structured report with checked modes, issue severities, fact kinds,
  fact keys, and pass/fail status.
- Optional baseline facts with `required: false` can be omitted by lower modes
  without warning.
- Duplicate fact identities inside a mode are reported as collapsed semantics.
- Failed custom assertions are folded into the same report.
- `modeLoweringReportText()` renders deterministic text for tests, docs, and
  review comments.
- `@flyingrobots/bijou` exports the helper and report types from the root
  barrel.

## Retrospective

- The important boundary is explicit runtime truth. Component authors supply
  facts like `entity:save-button` or `count:rows=3`; the helper checks fidelity
  without coupling itself to a renderer, AST, or screenshot.
- This composes with DOGFOOD stories and future replay tooling: both can attach
  semantic facts to rendered variants and use the same report format.
