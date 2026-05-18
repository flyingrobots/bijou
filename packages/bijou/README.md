# @flyingrobots/bijou

The pure, zero-dependency core of Bijou.

`@flyingrobots/bijou` provides the foundational primitives for CLIs, prompts, and portable terminal output. It manages components, themes, environment detection, and the core `Surface` and `LayoutNode` types.

## Role

- **Degradation-First**: Automatic mode detection for `interactive`, `static`, `pipe`, and `accessible` output.
- **Mixed-Mode**: High-performance `Surface` primitives for rich TUI apps, with
  string-first helpers for standalone CLI scripts.
- **Surface primitives without abandoning strings**: Runtime apps can stay on
  the surface path while CLI-first flows still use the string-first helpers.
- **Hexagonal Core**: Pure TypeScript logic isolated from platform IO via `Runtime`, `IO`, and `Style` ports.

## Install

```bash
npm install @flyingrobots/bijou @flyingrobots/bijou-node
```

## Quick Start

```typescript
import { initDefaultContext } from '@flyingrobots/bijou-node';
import { badge, boxSurface, tableSurface } from '@flyingrobots/bijou';

const ctx = initDefaultContext();

const panel = boxSurface(
  tableSurface({
    columns: [{ header: 'Service' }, { header: 'Status' }],
    rows: [['api', badge('LIVE', { variant: 'success', ctx })]],
    ctx,
  }),
  {
    title: 'Runtime',
    padding: { top: 1, bottom: 1, left: 1, right: 1 },
    ctx,
  },
);
```

## Strategy: Choosing Component Families

Select the family based on the interaction semantic, not just the visual shape.

Render-path naming follows one house rule: the base family name is the public
component, and a `*Surface()` companion means “the same family on the composable
surface path.” If there is no `*Surface()` companion, the family is either
already surface-native, intentionally string-first, or both paths would be
fake duplication rather than a real second API.

### Status and Feedback
- **`badge()`**: Compact, inline status.
- **`note()`**: Non-urgent explanation.
- **`alert()`**: Persistent, in-flow message.
- **`guidedFlow()`**: Calm multi-step assistance with one explicit next action.
- **`explainability()`**: AI- or machine-mediated recommendation with visible provenance and evidence.
- *Use `@flyingrobots/bijou-tui` notifications for stacking, history, or active routing.*

### Selection and Prompts
- **`select()`**: Single choice from a stable set.
- **`filter()`**: Search-led choice from a large or dynamic set.
- **`multiselect()`**: Choosing multiple values to build a set.
- **`confirm()`**: Strictly binary decisions.

### Hierarchy and Chronology
- **`tree()`**: Parent/child nesting.
- **`timeline()`**: Sequential, time-ordered events.
- **`dag()`**: Causal or dependency-based graphs.

### Progress and Wayfinding
- **`progressBar()`**: Determinate completion.
- **`spinner()`**: Indeterminate activity.
- **`breadcrumb()`**: Path context.
- **`stepper()`**: Ordered stages in a linear process.

### Theme Authoring
- **`extendTheme()`**: Build a custom theme from a known-good preset.
- **`doctorTheme()`**: Structured checks for invalid colors, weak contrast,
  and suspicious token reuse.
- **`themeContrastRatio()`**: Deterministic foreground/background contrast
  calculation for token-pair tests.

### Mode-Aware Authoring
- **`renderByMode()`**: Dispatch a component to the current output contract.
- **`lintModeLowering()`**: Compare explicit semantic facts across output modes.
- **`modeLoweringReportText()`**: Render a compact lowering report for tests,
  docs, and review comments.
- **`defineComponentMetadata()`**: Declare validated package, family, mode,
  arg, variant, invariant, example, and source facts for tooling.
- **`componentMetadataSummary()`**: Render compact metadata for docs, MCP
  payloads, and agent-facing reports.
- **`defineBlock()`**: Declare a validated reusable block with package, family,
  scale, mode, slot, variant, config, component, story, and semantic facts.
- **`defineBlockPackage()`**: Declare exported blocks, docs, tags, version, and
  Bijou peer compatibility for ordinary NPM block packages.
- **`blockMetadataSummary()`**: Render compact block metadata for docs, MCP
  payloads, and agent-facing reports.
- **`defineDataRequirement()` / `bindingSnapshot()` / `bindingFrame()`**:
  Model provider-delivered plain data as copied, versioned immutable snapshots
  and read-only render frames.
- **`commandIntent()`**: Declare user intent outputs as inspectable metadata,
  without business-logic callbacks or provider mutation handles.
- **`captureStoryMatrix()`**: Capture every profile/variant pair from a story
  renderer.
- **`storyCaptureMatrixText()`**: Render a deterministic multi-mode story
  matrix for docs and tests.
- **`createFixturePromotionRecord()`**: Preserve provenance when a fixture,
  docs page, story, example, or MCP payload is promoted into another surface.
- **`fixturePromotionText()`**: Render that promotion record for review and
  agent output.

## Documentation

- **[GUIDE.md](./GUIDE.md)**: Productive-fast path.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)**: Rendering doctrine, themes, and testing.
- **[Design System](../../docs/design-system/README.md)**: Foundations, token vocabulary, and component families.

---
Built with 💎 by [FLYING ROBOTS](https://github.com/flyingrobots)
