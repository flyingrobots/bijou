# Bijou Specifacts

This directory contains JSON acceptance artifacts that describe cross-cutting product
expectations for rendering, layout, worker runtime, and component behavior.

The repository currently treats these files as stable historical references plus
living acceptance contracts for large features. When you add new behavior, prefer
`docs/strategy`, `docs/design`, and `docs/method` for planning and execution,
then reflect the final contract here if it helps future maintainers.

## Purpose

Each `*.spec.json` file captures:

- a concise feature name and design intent,
- requirements and user story,
- acceptance criteria (what can be tested or observed),
- scope boundaries,
- a minimal test plan.

They are useful for:

- onboarding new contributors to historical design decisions,
- translating high-level design docs into concrete test scenarios,
- aligning future implementation work with explicit pass/fail criteria.

## Current Directory Shape

- `docs/specs/animation-heartbeat.spec.json`
- `docs/specs/bijou-css.spec.json`
- `docs/specs/bijou-web.spec.json`
- `docs/specs/buffered-surfaces.spec.json`
- `docs/specs/cell-diffing.spec.json`
- `docs/specs/component-system.spec.json`
- `docs/specs/continuum-bridge.spec.json`
- `docs/specs/data-viz.spec.json`
- `docs/specs/decoupled-layout.spec.json`
- `docs/specs/devtools-inspector.spec.json`
- `docs/specs/effect-handlers.spec.json`
- `docs/specs/eventbus-middleware.spec.json`
- `docs/specs/focused-pane-input.spec.json`
- `docs/specs/frame-settings-drawer.spec.json`
- `docs/specs/motion-api.spec.json`
- `docs/specs/preference-list-surface.spec.json`
- `docs/specs/rendering-pipeline.spec.json`
- `docs/specs/shader-v2.spec.json`
- `docs/specs/shell-notification-center.spec.json`
- `docs/specs/shell-quit-policy.spec.json`
- `docs/specs/snapshot-harness.spec.json`
- `docs/specs/story-protocol.spec.json`
- `docs/specs/sub-app-composition.spec.json`
- `docs/specs/syntax-textarea.spec.json`
- `docs/specs/token-graph.spec.json`
- `docs/specs/worker-runtime.spec.json`

## JSON Contract (Observed Shape)

A spec file generally follows this structure:

```json
{
  "name": "Feature Name",
  "designPattern": "Component / Pattern Name",
  "requirements": [
    "Requirement 1",
    "Requirement 2"
  ],
  "userStory": {
    "asA": "Persona",
    "iWant": "Desired behavior",
    "soThat": "Resulting benefit"
  },
  "acceptanceCriteria": [
    "Observable result that indicates success"
  ],
  "backwardCompatibility": "Compatibility notes or migration story",
  "scope": {
    "inScope": [
      "Area 1",
      "Area 2"
    ],
    "outScope": [
      "Not covered in this slice"
    ]
  },
  "testPlan": {
    "goldenPath": "Recommended manual/automated check",
    "edgeCases": ["Edge case scenario"],
    "fuzzStress": "Stress or scale scenario",
    "failureCases": ["Known failure to catch"]
  },
  "priority": "P1",
  "estimatedComplexity": {
    "linesOfCode": "~200",
    "timeComplexity": "O(...)",
    "workEstimate": "Medium"
  }
}
```

All fields are plain JSON strings, arrays, or small objects. The schema is intentionally
simple so specs can be edited and reviewed without generated tooling.

## `validateSpec()` Utility

At present, there is no globally required build-time validator for these files.
For local consistency, follow this pattern before merging a spec change:

1. Parse JSON.
2. Validate that required top-level keys exist (`name`, `requirements`, `acceptanceCriteria`, `userStory`, `testPlan`, `scope`, `priority`).
3. Validate value shapes (`string`, `array`, and nested object forms).
4. Optionally add a unit test around the parse rule for your feature area.

If you add or refactor a script, use a function named `validateSpec()` with this contract:

```ts
type SpecValidationError = { path: string; message: string };

type SpecValidationResult = { ok: boolean; errors: readonly SpecValidationError[] };

function validateSpec(value: unknown): SpecValidationResult {
  // parse and validate contract, return shape errors only.
}
```

This keeps spec maintenance local and transparent, and lets future tooling
consume the same contract without hard coupling to a single process.

## How to Add a New Spec File

1. Create `docs/specs/<name>.spec.json` and keep it narrowly focused.
2. Use one user story and explicit acceptance criteria.
3. Distinguish in-scope and out-of-scope decisions.
4. Add at least one test plan section (`goldenPath`, `edgeCases`, `failureCases`).
5. Update any related design docs and add a short link from the spec if relevant.
6. Run a JSON parse check (manual `cat` + `node -p`) before commit.

Example quick-check:

```bash
node -e "const fs=require('node:fs'); JSON.parse(fs.readFileSync('docs/specs/rendering-pipeline.spec.json', 'utf8'));"
```

## Operational Notes

The spec directory is not a replacement for executable tests. It is a contract
surface that should be supported by:

- unit tests,
- integration tests,
- DOGFOOD coverage checks,
- release smoke and regression gates.

If a spec is no longer accurate, archive it in place and create an updated one
rather than silently mutating historical evidence.
