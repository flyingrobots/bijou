# ComponentStory v0

_Design note for the first DOGFOOD substrate_

## Why this exists

Bijou currently has several near-miss representations of "a component in context":

- design-system family docs
- package/example README prose
- showcase `ComponentEntry`
- smoke and canary examples

Those artifacts overlap, but they do not share one canonical contract. `ComponentStory v0` is the first attempt to fix that.

The goal is not to design the forever-schema. The goal is to create the smallest structured record that can prove this loop:

1. a component family can be documented from structured fields
2. the same record can render a live demo
3. the same record can show graceful lowering across profiles
4. the same record can later grow selectors and scenarios without being thrown away

## The problem with `ComponentEntry`

Today’s showcase contract in [examples/showcase/types.ts](../../examples/showcase/types.ts) is useful, but too compressed:

- `description` is one markdown blob
- `render(width, ctx)` is one opaque demo function
- graceful lowering is mostly described in prose, not structured
- “when to use / when not to use” is not first-class data
- selectors, scenarios, source snippets, and variant controls have nowhere to live

That means it is good enough for a showcase, but not strong enough to become the substrate for docs, tests, and tooling.

## Design goals

`ComponentStory v0` should:

1. **Be structured enough for docs rendering**
   The docs surface should not have to parse one giant markdown blob to find summary, use, avoid, and lowering guidance.

2. **Stay small enough to author by hand**
   If the schema is too heavy, maintainers will bypass it and drift returns immediately.

3. **Support profile-aware demos directly**
   A story should be able to render itself in `rich`, `static`, `pipe`, and `accessible`.

4. **Model variants explicitly**
   Component families often have more than one canonical configuration worth teaching.

5. **Leave room for selectors and scenarios later**
   v0 should not depend on a selector model or scenario harness, but it should not block them either.

## Non-goals for v0

`ComponentStory v0` is not trying to solve:

- every possible interactive scenario
- full `PatternStory` design
- visual editor compatibility
- complete replay/assertion semantics
- an exhaustive control/knob system
- every component in the repo at once

## Proposed shape

```ts
type StoryPackage = 'bijou' | 'bijou-tui' | 'bijou-tui-app';
type StoryMode = 'interactive' | 'static' | 'pipe' | 'accessible';

type StoryPreview = string | Surface;

interface StoryLowering {
  readonly interactive: string;
  readonly static: string;
  readonly pipe: string;
  readonly accessible: string;
}

interface StoryDocs {
  readonly summary: string;
  readonly useWhen: readonly string[];
  readonly avoidWhen: readonly string[];
  readonly relatedFamilies: readonly string[];
  readonly gracefulLowering: StoryLowering;
}

interface StoryVariant<State = void> {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly initialState?: State;
  readonly render: (input: {
    readonly width: number;
    readonly ctx: BijouContext;
    readonly state: State;
  }) => StoryPreview;
}

interface StoryProfilePreset {
  readonly id: string;
  readonly label: string;
  readonly mode: StoryMode;
  readonly width: number;
}

interface StorySource {
  readonly examplePath?: string;
  readonly snippetLabel?: string;
}

interface ComponentStory<State = void> {
  readonly kind: 'component';
  readonly id: string;
  readonly family: string;
  readonly title: string;
  readonly package: StoryPackage;
  readonly docs: StoryDocs;
  readonly profilePresets: readonly StoryProfilePreset[];
  readonly variants: readonly StoryVariant<State>[];
  readonly source?: StorySource;
  readonly tags?: readonly string[];
}
```

## Why this shape

### `docs`

This is the biggest difference from `ComponentEntry`.

Instead of one markdown blob, the story has:

- `summary`
- `useWhen`
- `avoidWhen`
- `relatedFamilies`
- `gracefulLowering`

That makes the docs surface renderable without brittle parsing and keeps the design-system doctrine aligned with the story itself.

### `profilePresets`

This makes profile comparison explicit and small.

v0 should not model every possible runtime knob. It only needs enough to render canonical comparisons:

- one rich preset
- one static preset
- one pipe preset
- one accessible preset

Width is included because graceful lowering is often width-sensitive in terminal UIs.

### `variants`

Variants are first-class because many families are not taught well with one demo:

- `alert()` needs more than one tone
- `modal()` may need a simple and structured-body variant
- `viewportSurface()` may need one text case and one structured case

v0 keeps this minimal:

- label
- optional description
- optional initial state
- render function

### `source`

This stays intentionally light in v0.

The docs app only needs a way to say:

- where the canonical example lives
- or what snippet label should be shown

Anything more ambitious can come later with story tooling.

## Migration from `ComponentEntry`

The intended mapping is:

| `ComponentEntry` | `ComponentStory v0` |
|------------------|---------------------|
| `id` | `id` |
| `name` | `title` |
| `subtitle` | `docs.summary` |
| `description` | split into `docs.*` fields |
| `pkg` | `package` |
| `render(width, ctx)` | `variants[0].render(...)` |
| `tier` | dropped from v0 story core; this is showcase/workbench metadata, not story truth |

The important design choice here is dropping `tier` from the canonical story model.

Why:

- `tier` is about embedding/showcase ergonomics
- it is not a core truth about the component family itself
- if a future workbench needs it, it can layer that on top instead of contaminating the story substrate

## Recommended first stories

The first v0 stories should cover three different teaching problems:

### 1. `alert()` / `note()`

Why:

- low interaction complexity
- clear graceful lowering
- easy to render side-by-side

What they validate:

- structured docs fields
- simple profile comparison
- variant support

### 2. `modal()` / `drawer()`

Why:

- structured overlay content
- clearer “use vs avoid” doctrine
- richer TUI-only behavior without requiring a full app shell

What they validate:

- surface-native story previews
- overlay-family doctrine in structured form
- more than one meaningful variant

### 3. `viewportSurface()` or `navigableTableSurface()`

Why:

- tests a component whose value is not just appearance but behavior and composition

What they validate:

- structured TUI docs can still describe behavior honestly
- the docs surface can present width-sensitive behavior
- later selector/scenario integration has a real target

## Open questions

These are intentionally deferred, but should stay visible:

1. Should `ComponentStory` carry source snippets directly, or only references to example files?
2. Should `family` be a free string in v0, or a stricter id shared with the design-system docs?
3. Should profile presets live on the story, or should the docs app own the canonical presets globally?
4. Should `PatternStory` share a common base with `ComponentStory`, or be defined independently later?

## Recommended implementation sequence

1. Define the v0 type in code without promising permanence.
2. Author three canonical stories by hand.
3. Build the first docs surface around those stories.
4. Only after that, revisit selectors and scenarios.

That order matters because the immediate question is not “what is the perfect schema?” It is “can one structured story record actually replace duplicated docs/demo truth?”
