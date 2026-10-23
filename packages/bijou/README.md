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
- **`createSapphireReferencePalette()`**: Inspect or explore the shared
  hue-anchored references behind `BIJOU_DARK` and `BIJOU_LIGHT`.
- **`defineThemeSafePairs()`**: Declare reusable foreground/background
  contrast matrices for `doctorTheme()` and inspector surfaces.
- **`doctorTheme()`**: Structured checks for invalid colors, weak contrast,
  and suspicious token reuse.
- **`themeContrastRatio()`**: Deterministic foreground/background contrast
  calculation for token-pair tests.
- **Perceptual color helpers**: Convert sRGB, OKLAB, and OKLCH with
  `rgbToOklab()`, `rgbToOklch()`, `oklabToRgb()`, and `oklchToRgb()`; use
  `gamutMapOklch()` or `gamutRelativeOklch()` to stay inside sRGB; compare
  colors with `deltaEOk()`; and interpolate circular hue with
  `interpolateHue()`.

### Sapphire Noir First-Party Defaults

The legacy `CYAN_MAGENTA` preset is useful as a vivid terminal-native preset,
but it is not ideal as the model for dense product surfaces. It uses saturated
terminal colors for many unrelated jobs: cyan appears as info, active state,
cursor, scrollbar, logo, and primary border; magenta appears as accent,
secondary border, and focus gutter. That makes the app energetic, but it also
makes many regions compete at the same visual priority.

Bijou's `BIJOU_DARK` and `BIJOU_LIGHT` defaults are one derived **Sapphire
Noir** system. They use a calmer shell posture:

- neutral surfaces carry most of the screen
- one accent family carries local emphasis and shell selection
- status colors remain distinct from focus and brand
- muted text remains contrast-safe instead of merely dim
- dark and light themes both satisfy readable foreground/background pairs

The dark preset leads with low-chroma graphite surfaces, ice-neutral text, and
a luminous sapphire focus color. The light preset keeps the intentional warm
surface family as porcelain while using darker sapphire for interactive
chrome. Amber is reserved for warning; green, red, and cool violet retain
success, error, and information. Focus therefore no longer masquerades as a
warning, and informational status no longer collapses into brand chrome.

DOGFOOD consumes those defaults directly as one `DOGFOOD` shell theme family
with `Dark` and `Light` modes, so the docs app proves the same palette family
that first-party components should treat as the baseline. Both modes target at
least 4.5:1 contrast for surface text and common semantic foregrounds on every
shell surface.

#### Perceptual derivation

The first-party references are generated from `SAPPHIRE_HUE` (`255` degrees)
and mode-specific lightness/chroma curves. Chroma is expressed as a fraction
of the sRGB gamut boundary at the chosen OKLCH lightness and hue. This keeps a
relative chroma of `1` in gamut and avoids the hue shifts caused by clipping
RGB channels after conversion.

```ts
import { createSapphireReferencePalette } from '@flyingrobots/bijou';

const references = createSapphireReferencePalette('dark');
const customReferences = createSapphireReferencePalette('light', {
  brandHue: 265,
});
```

The public color-math floor uses normalized OKLAB lightness (`0..1`), OKLCH
chroma (`0` or greater), and hue in degrees. `gamutRelativeOklch()` clamps its
relative-chroma argument to `0..1`; `gamutMapOklch()` preserves normalized
lightness and hue while reducing out-of-gamut chroma. `interpolateHue()` takes
a progress value clamped to `0..1` and an explicit `shorter` or `longer` arc;
when longer-path endpoints normalize to the same hue, it travels one complete
turn. Use `deltaEOk()` for fast ordinary design-distance checks, not
high-precision colorimetry. Numeric helpers reject malformed tuples and
non-finite channels rather than emitting an invalid color.

The conversion matrices follow Björn Ottosson's
[OKLAB reference](https://bottosson.github.io/posts/oklab/). The
boundary-relative chroma model applies the same practical shell concept
documented by [nutelch](https://github.com/meodai/nutelch), implemented here by
a small deterministic binary search so Bijou keeps its zero-dependency core.

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
  scale, mode, slot, variant, config, component, story, semantic facts, optional
  view data contracts, and command intents.
- **`standardBlocks` / standard block exports**: Import the first-party
  standard block definitions for AppShell, ReaderSurface, InspectorPanel,
  inline status, in-flow status, transient overlay feedback, activity stream,
  shortcut cues, and progress. These expose contracts, stories, data
  requirements, command intents, and schema-bound posture, with deterministic
  first-proof render output across all output modes. Production AppShell
  behavior remains a later runtime slice.
- **`defineBlockPackage()`**: Declare exported blocks, docs, tags, version, and
  Bijou peer compatibility for ordinary NPM block packages.
- **`defineBlockSchemaAdapter()` / `defineSchemaBlock()`**: Validate unknown
  boundary data before producing immutable block render input and binding facts,
  without fetching, subscribing, dispatching, or rendering AppShell.
- **`blockMetadataSummary()`**: Render compact block metadata for docs, MCP
  payloads, and agent-facing reports.
- **`defineAppShellComposition()`**: Compose runtime-backed blocks into logical
  AppShell slots with an explicit provider scope, without rendering or
  subscribing.
- **`blockRenderNode()` / `renderBlockTree()`**: Explicitly render nested block
  declarations into parent slots when a preview or host intentionally wants a
  block tree, while ordinary `block.render()` remains a local single-block
  render contract.
- **`defineDataRequirement()` / `defineDataProvider()` / `providerScope()`**:
  Declare data requirements and explicit local provider availability without
  hidden global registration.
- **`defineViewData()`**: Group named data requirements for a view or block
  without binding them to providers.
- **`resolveProviderRequirement()`**: Resolve a requirement against an explicit
  local provider scope as frozen metadata, without subscribing or fetching.
- **`bindingFrameFromSnapshots()`**: Assemble read-only render frames from
  resolved provider metadata and already-created immutable snapshots.
- **`bindingSnapshot()` / `bindingFrame()`**: Model provider-delivered plain
  data as copied, versioned immutable snapshots and read-only render frames.
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

### Profunctor Page Inspection

- **`lowerProfunctorPageArtifacts()`**: Validate one canonical
  `profunctor-page/0`, `profunctor-page-source-map/0`, and
  `profunctor-build-manifest/0` family, then emit a deterministic
  `ui-scene-ir/1` scene, terminal `Surface`, target map, receipt, and text
  witness.
- **`ProfunctorPageTargetError`**: Inspect stable `code`, `path`, and `detail`
  fields when the bounded ProjectPage target rejects malformed,
  contradictory, or unsupported input.
- **[Profunctor Page Inspection reference](../../docs/book/bijou-designs.pdf#page=425)**:
  Review the exact input versions, supported blocks, inspection modes, output
  contracts, diagnostics, and verification commands.

## Documentation

- **[GUIDE.md](./GUIDE.md)**: Productive-fast path.
- **[ADVANCED_GUIDE.md](./ADVANCED_GUIDE.md)**: Rendering doctrine, themes, and testing.
- **[Design System](../../docs/book/bijou-designs.pdf#page=338)**: Foundations, token vocabulary, and component families.

---
Built with 💎 by [FLYING ROBOTS](https://github.com/flyingrobots)
