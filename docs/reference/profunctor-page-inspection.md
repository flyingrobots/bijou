# Inspect Profunctor Page Artifacts

Use `lowerProfunctorPageArtifacts()` to validate and inspect one canonical
Profunctor Page artifact family through Bijou's terminal target. The function
returns a deterministic `ui-scene-ir/1` scene, `Surface`, target map, receipt,
and text witness. It does not mutate the input artifacts.

This reference covers the bounded `bijou-terminal-project-page/1` target. It is
not a general Profunctor Page renderer.

## Public API

Import the function, error type, and input or output types from
`@flyingrobots/bijou`:

```typescript
import {
  lowerProfunctorPageArtifacts,
  ProfunctorPageTargetError,
  type ProfunctorArtifactInputs,
  type ProfunctorPageInspectionMode,
  type ProfunctorPageTargetProof,
} from '@flyingrobots/bijou';
```

The call accepts three exact UTF-8 JSON sources:

```typescript
const inputs: ProfunctorArtifactInputs = {
  page: {
    filename: 'page.profunctor.json',
    source: pageSource,
  },
  sourceMap: {
    filename: 'page.profunctor.map.json',
    source: sourceMapSource,
  },
  buildManifest: {
    filename: 'page.profunctor.build.json',
    source: buildManifestSource,
  },
};

const proof: ProfunctorPageTargetProof =
  lowerProfunctorPageArtifacts(inputs, { mode: 'source-refs' });
```

The example is illustrative. `pageSource`, `sourceMapSource`, and
`buildManifestSource` must contain the complete canonical artifact bytes.

## Inputs

| Input | Required artifact version | Bounded target requirement |
| :--- | :--- | :--- |
| `page` | `profunctor-page/0` | ProjectPage composition using only the supported block definitions |
| `sourceMap` | `profunctor-page-source-map/0` | Structured source occurrences with repository-relative paths |
| `buildManifest` | `profunctor-build-manifest/0` | One route, no sources or obstructions, and a digest matching the page bytes |

Each source must be canonical JSON with either no trailing newline or exactly
one trailing newline. The parser rejects unknown fields, missing fields,
duplicate identities, malformed identity prefixes, host-local paths, digest
drift, and cross-artifact disagreement.

The page, source map, and build manifest must agree on the page identity. The
manifest entity must agree with the page entity, its sole route must equal the
page route, and its dependencies must equal the page dependency digests in the
same order. Every source-map source and record digest, node provenance source
digest, and build entity digest must occur in that dependency list. The page
root must be a visible `block:page` whose route agrees with the page route.

## Supported Blocks

The bounded target supports these visible block definitions:

- `block:page`
- `block:project-hero`
- `block:project-facts`
- `block:project-documentation`
- `block:project-related`

A visible unsupported block fails with `BIJOU_PAGE_BLOCK_UNSUPPORTED`. A hidden
unsupported block becomes an explicit `hidden-unsupported-block` residual.

Semantic-document source-map entries, build-manifest document sources, and
application islands are outside this target. They fail explicitly instead of
being approximated.

## Inspection Modes

Omit `mode` to use `normal`.

| Mode | Witness content |
| :--- | :--- |
| `normal` | Project headings, facts, documentation destinations, and related-project actions |
| `node-ids` | Page-node identities |
| `source-refs` | Structured source-occurrence or provenance references |
| `token-refs` | Design-token references |
| `composition` | Composition, template-node, and block-definition identities |
| `obstructions` | Required capabilities, target dispositions, and residual explanations |

Modes change the terminal witness. They do not change the input identities or
claim browser semantics.

## Outputs

`ProfunctorPageTargetProof` contains:

| Field | Contract |
| :--- | :--- |
| `scene` | Bijou-owned `ui-scene-ir/1` value |
| `surface` | Lowered terminal `Surface` |
| `terminalProof` | Existing Bijou terminal-lowering proof and cell source map |
| `targetMap` | `bijou-profunctor-page-map/1` identities, regions, actions, tokens, source occurrences, reading order, outline, landmarks, and capability outcomes |
| `receipt` | `bijou-profunctor-page-receipt/1` input/output digests and explicit upstream-claim posture |
| `witness` | Deterministic plain-text terminal witness |
| `artifacts` | Canonical scene, map, receipt, and witness filenames with exact output bytes |

The target preserves page, composition, override, template, content,
source-occurrence, token, action, and target-render identities. Every visible
page node receives one render identity. A hidden unsupported node receives one
explicit residual.

Native links become Bijou action facts. Heading and landmark semantics become
structural facts. Semantic HTML remains an explicit residual; the target does
not inherit the build manifest's browser claims.

## Diagnostics

Failures throw `ProfunctorPageTargetError`. Inspect `code`, `path`, and `detail`
instead of parsing the message.

| Code | Meaning |
| :--- | :--- |
| `BIJOU_PAGE_INPUT_JSON_INVALID` | JSON is malformed or not canonical |
| `BIJOU_PAGE_INPUT_VERSION_UNSUPPORTED` | An input artifact version is not supported |
| `BIJOU_PAGE_INPUT_DIGEST_MISMATCH` | The manifest page digest does not match the exact page bytes |
| `BIJOU_PAGE_INPUT_IDENTITY_MISMATCH` | Related artifacts or owned source occurrences disagree |
| `BIJOU_PAGE_INPUT_REFERENCE_INVALID` | A required field, identity, graph edge, path, token, capability, action, or source shape is invalid |
| `BIJOU_PAGE_BLOCK_UNSUPPORTED` | The bounded target cannot honestly lower the requested block or source family |
| `BIJOU_PAGE_OUTPUT_INVALID` | An unexpected output construction or lowering invariant failed |

## Canonical Fixture And Verification

The checked Keep fixture pins the website-owned input bytes and the
Bijou-owned outputs:

- [Keep Profunctor Page conformance fixture](../../fixtures/profunctor-page/project-keep/README.md)
- [DX-050 design record](../design/DX-050-profunctor-page-inspection.md)

Regenerate the output artifacts:

```bash
npm run generate:profunctor-page-target
```

Verify that the checked artifacts match the current lowerer:

```bash
npm run check:profunctor-page-target
```

Run the focused contract evidence:

```bash
npx vitest run \
  tests/cycles/DX-050/profunctor-page-target.part01.test.ts \
  tests/cycles/DX-050/profunctor-page-target.part02.test.ts \
  tests/cycles/DX-050/profunctor-page-target.part03.test.ts \
  tests/cycles/DX-050/profunctor-page-target.part04.test.ts
```
