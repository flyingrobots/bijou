---
title: DX-034 Declarative View Data Binding
legend: DX
lane: design
---

# DX-034 Declarative View Data Binding

_Cycle for formalizing unidirectional, declarative, immutable data binding
between business logic, active views, and block composition_

Legend:

- [DX - Developer Experience](../legends/DX-developer-experience.md)

Depends on:

- [DX-031 - Standard Bijou Blocks](./DX-031-standard-bijou-blocks.md)
- [RE-001 - Define Runtime Engine Architecture](./RE-001-define-runtime-engine-architecture.md)
- [RE-003 - Retain Layout Trees And Layout Invalidation](./RE-003-retain-layout-trees-and-layout-invalidation.md)
- [RE-005 - Buffer Commands And Effects Separately](./RE-005-buffer-commands-and-effects-separately.md)
- [RE-006 - Formalize Component Layout And Interaction Contracts](./RE-006-formalize-component-layout-and-interaction-contracts.md)

## Why This Cycle Exists

DX-031 gave Bijou a metadata-first block contract, but it did not answer the
next developer-experience question:

How does a block or view declare the data it needs, and how does that data
arrive when the block is part of the active view hierarchy?

Bijou already has adjacent runtime pieces:

- explicit application state and view stacks
- retained layouts for active views
- component layout and interaction contracts
- command and effect buffers
- an event bus for runtime messages

Those are necessary, but they are not a data-binding architecture.

This cycle exists to formalize the missing layer before AppShell, nested
blocks, schema-bound blocks, or generated block packages harden the wrong API.

## Core Rule

Data binding in Bijou is:

- unidirectional
- declarative
- immutable

Data flows from business logic and provider adapters into active views.

Views render immutable snapshots.

Views do not mutate business state, provider state, caches, stores, channels,
or resources.

Views communicate user intent by emitting Commands. Business logic handles those
Commands, updates state or provider inputs, and produces the next immutable
snapshot. That is the loop.

```text
business state / adapters
  -> providers
  -> immutable binding snapshots
  -> active view hierarchy
  -> render
  -> user input
  -> Commands expressing intent
  -> business logic
  -> next state / provider inputs
```

There is no reverse data mutation path from view to provider.

## Boundary

This cycle is about data requirements and binding lifecycle.

It is not about:

- two-way binding
- mutable stores exposed to views
- hidden global provider registration
- letting views read process, filesystem, network, or database adapters directly
- making schemas own presentation
- replacing Commands with arbitrary event side effects
- forcing every component to become provider-aware

## Sponsor Human

App builders composing shell, reader, inspector, form, and data blocks who need
the view tree to bind to business data without manual prop plumbing or hidden
mutation.

## Sponsor Agent

Agents generating Bijou apps or block packages that need to inspect what data a
view requires, which providers can satisfy it, and which Commands the view can
emit.

## Hill

A builder can declare an AppShell whose navigation, content, inspector, and
status regions bind to provider-backed immutable data snapshots, while every
user action leaves the view tree as an explicit Command intent handled by
business logic.

## Playback Questions

- Which data requirements does this active view tree declare?
- Which provider satisfies each requirement?
- What is the immutable snapshot version currently rendered?
- Is each binding ready, loading, stale, empty, or failed?
- Which Commands can this view emit?
- Which business reducer or adapter action handles each Command?
- What provider subscriptions are active only because this view is active?
- What is disposed or suspended when the view leaves the active hierarchy?

## Vocabulary

### Business Logic

The state machine, reducers, command handlers, domain services, and host
adapters that own application truth.

Business logic may read or write external systems through ports and adapters.
Views may not.

### Provider

A runtime-backed source that can produce immutable snapshots for a declared
data requirement.

A provider may be backed by:

- in-memory business state
- a channel or message stream
- a query cache
- a filesystem adapter
- a database adapter
- a GraphQL, REST, or MCP adapter
- a localization catalog
- a credential-status adapter that never exposes secret values

The backing mechanism is not visible to views. The view sees only a binding
snapshot.

### Data Requirement

A declarative statement made by a block, view, or component:

```text
I need this named resource or signal, with these parameters, in this slot.
```

Requirements are data, not callbacks. They are inspectable before binding.

### Binding Scope

The provider registry visible to a subtree of the active view hierarchy.

Scopes let an app provide one navigation source at the shell level, override a
selection source inside a modal, or bind a test provider for a story without
touching global state.

### Binding Snapshot

An immutable runtime value created by a provider for one requirement.

A snapshot has:

- provider id
- requirement id
- version
- status
- data when ready
- issues when failed
- freshness facts when stale
- semantic facts for tooling and lower modes

### Command

A typed intent emitted by a view in response to user input.

Commands say what the user intended. They do not contain hidden provider
mutations.

## Architecture

### 1. Views Declare Requirements

Blocks and views should declare data requirements alongside metadata:

```ts
const readerSurfaceBlock = defineBlock({
  metadata: readerSurfaceMetadata,
  data: defineViewData({
    article: requiredResource(articleResource, {
      id: routeParam('articleId'),
    }),
    outline: optionalResource(articleOutlineResource, {
      id: routeParam('articleId'),
    }),
  }),
  commands: {
    selectHeading: commandIntent<{ headingId: string }>('reader.selectHeading'),
  },
  render: ({ data, command }) => readerSurface({
    article: data.require('article'),
    outline: data.get('outline'),
    onSelectHeading: headingId => command('selectHeading', { headingId }),
  }),
});
```

This sketch is not final API. The required properties are:

- data requirements are declared, not discovered from render-time reads
- requirements are named
- requirements are inspectable before rendering
- Commands are declared as intent outputs
- render receives immutable binding data, not provider objects

### 2. Active Views Determine Active Bindings

The runtime should resolve data only for views in the active view hierarchy.

When a view becomes active:

1. collect its data requirements
2. resolve each requirement against the nearest binding scope
3. request or subscribe to provider snapshots
4. create a binding frame
5. render the view from that immutable frame

When a view becomes inactive:

1. dispose or suspend bindings owned only by that view
2. preserve shared provider caches only when the provider owns that policy
3. remove binding facts from active runtime introspection

The view tree does not manually subscribe or unsubscribe.

### 3. Providers Normalize Every Backing Source

Providers hide transport details.

Whether data comes from an event, a message channel, a query, a file, or memory,
the provider contract should normalize it into immutable snapshots:

```ts
interface BindingSnapshot<Data> {
  readonly providerId: string;
  readonly requirementId: string;
  readonly version: number;
  readonly status: 'ready' | 'loading' | 'empty' | 'stale' | 'error';
  readonly data?: DeepReadonly<Data>;
  readonly issues: readonly BindingIssue[];
  readonly facts: readonly BindingFact[];
}
```

Provider updates do not mutate mounted views. They produce a new snapshot
version and trigger a runtime binding invalidation. The next render receives a
new immutable binding frame.

DX-034A snapshots accept inert plain snapshot data: null, strings, numbers,
booleans, arrays, and enumerable string-keyed plain objects. They reject mutable
built-ins and executable values such as `Map`, `Set`, `Date`, typed arrays,
functions, accessors, symbol-keyed properties, symbols, and bigint. Snapshot
construction copies accepted data before freezing it, so provider-owned or
business-owned source objects are not frozen in place.

### 4. Binding Frames Are Immutable

Render receives a binding frame, not mutable provider handles.

The frame should support explicit reads:

```ts
data.require('article');
data.get('outline');
data.status('comments');
data.issues('reviews');
```

The frame should not support writes.

Any attempt to mutate data from inside a view should be structurally impossible
in the public API and rejected at runtime where objects cross a boundary.

### DX-034A Binding Snapshot And Frame Primitives

DX-034A lands the first runtime-truth slice in `@flyingrobots/bijou`.

The public core now includes:

- `DataRequirement`
- `ProviderId`
- `RequirementId`
- `BindingStatus`
- `BindingSnapshot`
- `BindingFrame`
- `BindingIssue`
- `BindingFact`
- `CommandIntent`
- `defineDataRequirement()`
- `bindingSnapshot()`
- `bindingFrame()`
- `commandIntent()`

This slice proves the objects, not the full runtime lifecycle:

```ts
const article = defineDataRequirement({
  id: 'article',
  resource: 'docs.article',
});

const snapshot = bindingSnapshot({
  providerId: 'docs.articleProvider',
  requirementId: article.id,
  version: 1,
  status: 'ready',
  data: { title: 'DX-034' },
});

const frame = bindingFrame([snapshot]);

frame.require('article');
frame.get('article');
frame.status('article');
frame.issues('article');
```

The current `BindingFrame` deliberately does not include provider scopes,
subscriptions, active hierarchy traversal, schema adapters, command dispatch, or
AppShell rendering. Those remain follow-on runtime layers.

### 5. User Input Emits Commands

Views communicate user intent through Commands:

```ts
command('reader.selectHeading', { headingId });
command('article.refreshRequested', { articleId });
command('nav.openItem', { itemId });
```

Business logic receives those Commands through the existing runtime command
path, updates state or provider parameters, and lets providers publish the next
snapshot.

Commands are the only sanctioned path from views back toward business logic.

### 6. Binding Facts Lower Across Modes

Binding status is semantic UI truth.

Ready, loading, empty, stale, and error states must lower across interactive,
static, pipe, and accessible modes without parsing rendered text.

Examples:

- loading article body becomes a loading fact and an accessible status line
- stale search results expose stale facts even if the rich view only shows a
  subtle marker
- failed credential-status provider exposes provider status but never secret
  values
- empty comments list lowers as an empty-state fact rather than disappearing

### 7. Provider Scopes Are Explicit

Provider scopes should be attached by business logic, app shells, tests, or
stories:

```ts
const app = appShell({
  providers: providerScope([
    provide(articleResource, articleProvider),
    provide(selectionResource, selectionProvider),
    provide(commandLogResource, commandLogProvider),
  ]),
  slots: {
    navigation: navigationBlock(),
    content: readerSurfaceBlock(),
    inspector: inspectorPanelBlock(),
  },
});
```

No import should register a global provider as a side effect.

## AppShell Implications

AppShell should not be only a layout helper.

It should be the first proof that:

- named block slots can contain nested provider-bound blocks
- shell-level provider scope can feed navigation, content, inspector, status,
  and overlay regions
- region bindings are semantic, not physical left/right assumptions
- region Commands bubble as user intent, not direct shell mutation
- active region changes can alter which bindings are active without leaking
  subscriptions

Conceptual AppShell shape:

```ts
const docsApp = appShell({
  providers: docsProviderScope,
  slots: {
    navigation: navigationListBlock({
      data: { items: docsNavResource },
      commands: { openItem: 'docs.openArticle' },
    }),
    content: readerSurfaceBlock({
      data: { article: activeArticleResource },
      commands: { selectHeading: 'docs.selectHeading' },
    }),
    inspector: inspectorPanelBlock({
      data: { selection: activeSelectionResource },
    }),
    status: statusBarBlock({
      data: { sync: docsSyncStatusResource },
    }),
  },
});
```

The final API may differ. The architectural point is that slots contain nested
blocks that declare their own data requirements, and the active hierarchy
resolves those requirements through explicit scopes.

## Relationship To Existing Systems

### DX-031 Blocks

DX-031 metadata remains useful for discovery, docs, package manifests, and
story indexing.

DX-034 adds the missing runtime-authoring layer: declared data requirements,
provider scopes, immutable binding frames, and command intent outputs.

### Runtime Engine

RE-001 through RE-006 already separate state, view stack, retained layouts,
input routing, commands, effects, and component interaction.

DX-034 should reuse that spine instead of inventing a second event model.

### Event Bus

The event bus is a carrier for runtime messages and command results.

It is not the data-binding source of truth.

A provider may listen to a channel or event stream internally, but the view
binding contract still sees immutable snapshots, not the bus.

### Schema-Bound Blocks

Schema-bound blocks are narrower than provider-bound views.

Schemas validate the shape of data. Providers answer where data comes from,
when it updates, what its lifecycle status is, and which active view owns the
binding.

The two should compose:

```text
provider snapshot
  -> schema adapter validates data
  -> immutable binding frame
  -> block render
```

## Accessibility / Assistive Posture

Assistive modes need the binding state, not only the rendered cells.

Every provider-bound view should expose:

- loading state
- stale state
- empty state
- error state
- selected or active entity, when relevant
- available intent Commands, when relevant
- redaction facts for sensitive provider-backed surfaces

## Localization / Directionality Posture

Providers should deliver data, not localized shell policy.

Localized text can be data when it comes from a catalog provider, but layout
direction, fallback copy, and shell-owned labels remain host or i18n runtime
responsibility.

Data requirements should avoid physical slot names such as `leftNav` or
`rightInspector`; use logical names such as `navigation`, `content`,
`inspector`, and `status`.

## Agent Inspectability / Explainability Posture

Agents should be able to inspect:

- the active view hierarchy
- each view's data requirements
- provider resolution for each requirement
- current binding snapshot status and version
- Commands each view may emit
- binding invalidation causes
- teardown/suspension state for inactive views

Agents should not need to parse rendered terminal output to understand data
flow.

## Linked Invariants

- [Runtime Truth Wins](../invariants/runtime-truth-wins.md)
- [Schemas Live At Boundaries](../invariants/schemas-live-at-boundaries.md)
- [Commands Change State, Effects Do Not](../invariants/commands-change-state-effects-do-not.md)
- [State Machine and View Stack Are Distinct](../invariants/state-machine-and-view-stack-are-distinct.md)
- [Layout Owns Interaction Geometry](../invariants/layout-owns-interaction-geometry.md)
- [Tests Are the Spec](../invariants/tests-are-the-spec.md)

## Implementation Outline

1. Done: define the public architecture vocabulary:
   - `DataRequirement`
   - `BindingSnapshot`
   - `BindingFrame`
   - `CommandIntent`
2. Done: add behavioral tests proving the design remains unidirectional,
   declarative, and immutable at the primitive layer.
3. Done: add pure runtime primitives for immutable binding snapshots and
   binding frames.
4. Next: define provider and provider-scope contracts without global
   registration.
5. Next: add provider-scope resolution.
6. Next: add active-view binding collection over the existing view-stack model.
7. Next: add invalidation flow from provider snapshot updates to view re-render.
8. Next: add Command intent dispatch proof.
9. Next: integrate the contract with DX-031 block definitions.
10. Next: prove AppShell with nested provider-bound navigation, content, inspector,
   and status blocks.
11. Next: add DOGFOOD stories and captures for ready, loading, stale, empty, and
    error binding states.

## Tests To Write First

- Behavioral tests proving public binding frames expose immutable data without
  provider handles.
- Behavioral tests proving binding snapshots are immutable and versioned.
- Behavioral tests proving command intents are metadata, not callbacks.
- Runtime tests proving provider scopes resolve nearest-provider wins without
  hidden globals.
- Runtime tests proving active views create bindings and inactive views dispose
  or suspend them.
- Runtime tests proving provider updates create new binding frames instead of
  mutating the current frame.
- Runtime tests proving views can emit Commands but cannot mutate provider data.
- Runtime tests proving Commands flow to business logic and produce later
  snapshots through the normal update loop.
- Mode-lowering tests proving ready, loading, stale, empty, and error binding
  states survive in pipe and accessible output.
- DOGFOOD tests proving AppShell nests provider-bound blocks through named
  logical regions.

## Acceptance Criteria

- Bijou has a documented data-binding architecture before expanding the block
  API further.
- Data flow is one-way from business logic/providers into immutable view
  snapshots.
- Views communicate user intent only through Commands.
- Providers are explicit, scoped, and free of import-time global registration.
- Active view hierarchy controls which data bindings are active.
- Provider updates produce new immutable binding frames.
- Binding status is visible to tooling and lower modes.
- Schema-bound blocks compose with provider-bound views but do not replace the
  provider lifecycle.
- AppShell is designed around nested provider-bound blocks in logical slots.

## Risks / Unknowns

- The first API could accidentally expose provider handles to views. That would
  violate the core rule.
- The provider lifecycle could duplicate existing runtime command/effect
  buffering if it is not layered carefully.
- If provider scopes are too implicit, debugging active data flow will become
  difficult.
- If binding frames are only TypeScript shapes, they will not satisfy the
  repo's runtime-truth standard.
- Schema binding, provider binding, and slot binding can blur together. The
  architecture should keep them separate:
  - schemas validate data shape
  - providers deliver immutable snapshots
  - slots compose views and blocks
  - Commands express user intent

## Retrospective

DX-034A landed the primitive contract layer first. The important restraint is
that `BindingFrame` is not a provider scope, subscription manager, active-view
resolver, schema adapter, or AppShell slot model. It is only the immutable data
frame views can read during render.
