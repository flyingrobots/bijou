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

DX-034B makes scopes explicit local values in the public contract. A
`ProviderScope` declares which `DataProvider` metadata is available for which
resource, but it does not subscribe, refresh, resolve nested scopes, or dispatch
Commands.

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

The `BindingFrame` deliberately does not include provider scopes, subscriptions,
active hierarchy traversal, schema adapters, command dispatch, or AppShell
rendering. Those remain separate runtime layers.

### DX-034B Provider Scope Contracts

DX-034B lands the explicit provider/scope contract layer in
`@flyingrobots/bijou`.

The public core now includes:

- `DataProvider`
- `DataProviderInput`
- `ProviderScope`
- `ProviderScopeEntry`
- `ProviderScopeOptions`
- `defineDataProvider()`
- `provide()`
- `providerScope()`
- `isDataProvider()`
- `ProviderResolution`
- `ProviderResolutionStatus`
- `resolveProviderRequirement()`
- `resolveProviderRequirements()`
- `BindingFrameAssembly`
- `bindingFrameFromSnapshots()`
- `ViewDataContract`
- `ViewDataRequirementEntry`
- `defineViewData()`

This slice proves local provider availability and one-scope resolution, not
hierarchical provider resolution or subscription lifecycle:

```ts
const article = defineDataRequirement({
  id: 'article',
  resource: 'docs.article',
});

const readerData = defineViewData({
  id: 'reader.data',
  requirements: [{ name: 'article', requirement: article }],
});

const articleProvider = defineDataProvider({
  id: 'docs.articleProvider',
  resource: article.resource,
});

const providers = providerScope([provide(articleProvider)], {
  id: 'docs.appShell',
});

providers.has(article.resource);
providers.get(article.resource);
providers.resources();

const resolution = resolveProviderRequirement(article, providers);
resolution.status;

const assembled = bindingFrameFromSnapshots({
  resolutions: [resolution],
  snapshots: [
    bindingSnapshot({
      providerId: 'docs.articleProvider',
      requirementId: 'article',
      version: 1,
      status: 'ready',
      data: { title: 'DX-034' },
    }),
  ],
});
assembled.frame.require('article');
```

`ProviderScope` rejects duplicate resources and duplicate provider ids inside a
single scope. It also rejects loose provider-shaped objects, so importing a
module cannot silently register a provider or bypass the constructor contract.
`ViewDataContract` names the data a view needs before any provider binding
occurs.
Resolution results are frozen metadata. Missing required providers become
deterministic issues; missing optional providers are inspectable but not errors.
Frame assembly reports missing or provider-mismatched snapshots as deterministic
issues while keeping provider reads outside the render frame.

### DX-034C AppShell Composition Contract

DX-034C lands the first structural AppShell composition contract in
`@flyingrobots/bijou`.

The public core now includes:

- `AppShellComposition`
- `AppShellCompositionInput`
- `AppShellSlot`
- `AppShellSlotContent`
- `AppShellSlotId`
- `AppShellSlots`
- `defineAppShellComposition()`
- `isAppShellComposition()`

This slice proves semantic shell slots and inspectability. It still does not
render AppShell, resolve hierarchical provider scopes, subscribe, refresh, walk
the active hierarchy, or dispatch commands:

```ts
const docsShell = defineAppShellComposition({
  id: 'docs.shell',
  providers,
  slots: {
    navigation: navigationBlock,
    content: readerSurfaceBlock,
    inspector: inspectorPanelBlock,
  },
});

docsShell.slotIds();
docsShell.slot('content');
docsShell.dataContracts();
docsShell.commandIntents();
docsShell.providerScope();
```

Slots are logical regions: `navigation`, `content`, `inspector`, `status`, and
`overlays`. Physical slots such as `leftNav` are rejected at construction time.
Slot content must be a block returned by `defineBlock()` or nested arrays of
such blocks. The composition exposes the nested blocks' declared view data
contracts and command intents for tooling without adding provider handles or
render-time mutation paths.

### DX-034D Active Binding Lifecycle

DX-034D formalizes the active binding lifecycle before rendered AppShell or
runtime provider subscriptions begin.

Core invariant:

```text
Active hierarchy owns which bindings are active.
Providers publish snapshots.
Runtime assembles new frames.
Views render frames.
Commands leave views as intent.
Business logic owns change.
```

This slice is design-only. It defines lifecycle ownership and vocabulary; it
does not implement provider subscriptions, active hierarchy traversal, command
dispatch, rendered AppShell, schema binding, cache retention, or DOGFOOD
integration.

#### Lifecycle Ownership

The active view hierarchy owns binding lifetime.

A data requirement becomes active when all of these are true:

1. a block or view declares the requirement through an inspectable data contract
2. that block or view is present in the active hierarchy
3. the runtime resolves the requirement against an explicit provider scope
4. the runtime creates binding ownership for that active view node

Views never choose their own binding state. Views do not subscribe, refresh,
dispose, retain cache, or mutate provider state. The runtime owns lifecycle
transitions and provider subscription policy.

#### Lifecycle Vocabulary

Use the smallest useful lifecycle vocabulary first:

- `active`: the requirement is owned by the active hierarchy; the runtime may
  hold a provider subscription; provider snapshots can invalidate the current
  frame.
- `suspended`: the requirement is not currently rendering, but runtime/provider
  policy may retain resumable state or cache. Views do not decide what is
  retained.
- `disposed`: the requirement ownership is released. The runtime no longer
  expects provider updates for that view binding.

Provider cache retention is provider/runtime policy, not view policy. DX-034D
names lifecycle states but does not implement cache retention.

#### Provider Subscription Ownership

Provider subscriptions are runtime lifecycle. Binding frames are immutable
render inputs.

Providers may subscribe to channels, messages, queries, files, databases, MCP,
or in-memory business state internally, but render receives only immutable
snapshots assembled into a `BindingFrame`. A view never receives provider
handles, subscription handles, refresh methods, mutable stores, or dispatcher
callbacks.

#### Provider Update Flow

Provider updates do not mutate rendered views or existing frames.

The lifecycle flow is:

```text
provider publishes snapshot
  -> runtime records binding invalidation
  -> runtime assembles next BindingFrame
  -> active view renders the next frame
```

Invalidation belongs to runtime binding ownership, not to rendered cells. Static,
pipe, and accessible modes must be able to observe lifecycle facts such as
active, suspended, disposed, loading, stale, empty, error, and invalidated
without parsing terminal output.

#### Command Flow

Commands leave views as intent records.

Views may emit declared command intents, but they do not dispatch business
logic, call provider methods, or mutate provider inputs. Runtime command
integration receives command intent records and hands them to business logic.
Business logic handles Commands, updates state or provider inputs, and providers
eventually publish new snapshots.

#### Active Lifecycle Questions

DX-034D answers:

- When does a requirement become active?
- Who owns the binding while a view is active?
- What happens when a view leaves the active hierarchy?
- What is suspended versus disposed?
- Who owns provider subscriptions?
- How does a provider update become a new `BindingFrame`?
- How do Commands leave views?
- Who dispatches Commands to business logic?
- What lifecycle facts are inspectable?
- What lower-mode facts survive static, pipe, and accessible output?

### DX-034E Binding Lifecycle Primitives

DX-034E implements lifecycle as transition algebra, not as a runtime manager.

The primitives answer what state a binding is in, who owns it, what transition
produced the next record, what invalidation happened, and what lifecycle facts
tooling can inspect.

They do not subscribe, refresh, dispatch, traverse the active view tree, render
AppShell, retain caches, or bind schemas.

The public vocabulary stays deliberately small:

- `BindingLifecycleOwner`: the active-view, block, AppShell, or runtime owner
  responsible for one binding lifetime.
- `BindingLifecycleRecord`: an immutable record for one owner and one
  requirement.
- `BindingLifecycleState`: `active`, `suspended`, and `disposed`.
- `BindingLifecycleTransition`: the immutable record of an activation,
  suspension, disposal, or invalidation transition.
- `BindingInvalidation`: an immutable fact that a provider update, scope
  change, manual runtime action, owner suspension, or owner disposal means a
  later runtime layer should assemble a new frame.

Allowed transitions are:

```text
active -> suspended
active -> disposed
suspended -> active
suspended -> disposed
active -> active by invalidation only
suspended -> suspended by invalidation only
```

Disposed bindings cannot be activated, suspended, or invalidated. A disposed
binding means ownership was released; later activation requires a new lifecycle
record and a new ownership event.

Provider updates create invalidation records. They do not mutate existing
frames, fetch data, call providers, or dispatch Commands:

```text
provider publishes snapshot
  -> runtime creates BindingInvalidation
  -> runtime later assembles next BindingFrame
```

Lifecycle records are immutable facts, not managers. They expose no provider
handles, subscription handles, refresh methods, command dispatch callbacks,
mutable stores, or render hooks.

### DX-034F Active Binding Collection

DX-034F collects declared active bindings before provider runtime integration.

The collection answers:

```text
given declared data requirements and explicit lifecycle owners,
which owner/requirement pairs are active?
```

It uses `BindingLifecycleOwner` from DX-034E. It does not introduce another
ownership vocabulary. An active binding entry binds:

- one explicit `BindingLifecycleOwner`
- one declared `DataRequirement`
- optional provider id metadata

Collections can produce active `BindingLifecycleRecord` values from those
entries so the later runtime layer has stable ownership facts to consume:

```ts
const collection = activeBindingCollection([
  activeBindingEntry({
    owner: defineBindingLifecycleOwner({
      id: 'docs.shell',
      kind: 'app-shell',
    }),
    requirement: articleRequirement,
    providerId: 'docs.articleProvider',
  }),
]);

collection.entries();
collection.requirements();
collection.owners();
collection.lifecycleRecords();
```

DX-034F also allows declared `ViewDataContract` values to be collected without
rendering blocks or views:

```ts
const collection = collectActiveBindings({
  contracts: [{
    owner,
    contract: readerSurfaceBlock.data,
    providerIds: [
      { requirementId: 'article', providerId: 'docs.articleProvider' },
    ],
  }],
});
```

Collection inspects declarations, not rendered output. It does not subscribe,
refresh, dispatch, render, cache, resolve provider scopes, traverse the real TUI
runtime tree, bind schemas, or integrate DOGFOOD. Provider ids are metadata
only; provider handles are not exposed.

### DX-034G Active View Binding Collection

DX-034G connects the pure active-binding collection contract to the existing
runtime view-stack model in `@flyingrobots/bijou-tui`.

The runtime view stack determines which layers contribute active bindings:

- the top layer is active
- layers below remain active only while each layer above them has
  `blocksBelow: false`
- a layer with `blocksBelow: true` blocks lower layers from active binding
  ownership

Runtime binding collection still inspects declarations, not rendered output.
Layers expose branded `RuntimeViewBindingSource` values, and
`collectRuntimeViewBindings()` converts active sources into an
`ActiveBindingCollection`.

Runtime binding sources normalize, copy, and freeze provider assignment metadata
at construction so later caller mutation cannot change active binding
collection results.

DX-034G does not subscribe, refresh, dispatch, render, cache, resolve provider
handles, bind schemas, or integrate DOGFOOD. It only proves that the active
view hierarchy can identify active owner/requirement pairs.

### DX-034H Provider Update Invalidation Flow

DX-034H proves the provider-update half of the loop without implementing a
provider manager.

`bindingFrameUpdateFromSnapshots()` takes:

- an `ActiveBindingCollection`
- an explicit `ProviderScope`
- immutable `BindingSnapshot` values
- optional current lifecycle records

It resolves the collection's requirements against the scope, assembles the next
immutable `BindingFrame`, and records provider updates as lifecycle
invalidations. It never mutates the previous frame or lifecycle records.
Snapshots whose provider id and version already appear in a lifecycle record's
provider-update invalidations do not create duplicate invalidations or lifecycle
churn.
Explicit provider assignments carried by active binding entries are
authoritative: a scope-resolved provider that conflicts with an explicit
assignment becomes a deterministic `provider.assignment-mismatch` issue rather
than data in the frame.

```text
provider publishes snapshot
  -> binding lifecycle records receive invalidation facts
  -> runtime assembles next immutable BindingFrame
  -> views later render the new frame
```

DX-034H does not fetch data, subscribe, refresh providers, retain caches, walk
the active hierarchy, render AppShell, or dispatch Commands.

### DX-034I Command Intent Dispatch Proof

DX-034I proves the command half of the loop without putting business logic in
views.

Views emit branded `RuntimeCommandIntentEmission` values from declared
`CommandIntent` metadata. Runtime code maps those emissions through explicit
`RuntimeCommandIntentRoute` values into the existing `RuntimeCommandBuffer`.
Business logic still handles the resulting command later through the normal
command-buffer path.
Emissions copy and deeply freeze inert payload data before routing so caller
mutation cannot change the command that eventually reaches business logic.

```text
view emits command intent
  -> runtime maps intent to a command
  -> command buffer records the command
  -> business logic applies the command later
```

Command intents and emissions expose no provider handles, subscription handles,
refresh methods, dispatch callbacks, mutable stores, or render hooks.

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
    provide(articleProvider),
    provide(selectionProvider),
    provide(commandLogProvider),
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
4. Done: define provider and provider-scope contracts without global
   registration.
5. Done: add one-scope provider resolution.
6. Done: assemble immutable binding frames from resolved snapshots.
7. Done: declare view data contracts.
8. Done: integrate view data and command contracts with DX-031 block definitions.
9. Done: add a structural AppShell composition contract for semantic slots,
   explicit provider scopes, and nested block data/command introspection.
10. Done: formalize the active binding lifecycle before runtime subscriptions
   or rendered AppShell begin.
11. Done: add binding lifecycle primitives as immutable transition-algebra
   value objects.
12. Done: add active binding collection primitives for declared owner and
   requirement pairs.
13. Done: add active-view binding collection over the existing view-stack model.
14. Done: add invalidation flow from provider snapshot updates to new immutable
   binding frames.
15. Done: add Command intent dispatch proof through the runtime command buffer.
16. Done: prove rendered AppShell with provider-bound navigation, content,
    inspector, and status blocks.
17. Done: add DOGFOOD stories and captures for ready, loading, stale, empty,
    and error binding states through the standard block story and DOGFOOD
    preview surface.

## Tests To Write First

- Behavioral tests proving public binding frames expose immutable data without
  provider handles.
- Behavioral tests proving binding snapshots are immutable and versioned.
- Behavioral tests proving command intents are metadata, not callbacks.
- Behavioral tests proving provider scopes are explicit local registries without
  hidden globals.
- Cycle tests proving the active hierarchy owns active binding lifetime,
  provider subscriptions belong to runtime lifecycle, and binding frames remain
  immutable render inputs.
- Behavioral tests proving lifecycle records are immutable transition-algebra
  facts with active, suspended, disposed, and invalidated states.
- Behavioral tests proving active binding collections bind declared
  requirements to explicit lifecycle owners without rendering, subscribing, or
  dispatching.
- Runtime tests proving active view-stack layers determine active bindings
  without rendering, subscribing, or dispatching.
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
- Active binding collections expose active owner/requirement pairs and lifecycle
  ownership records before runtime provider integration.
- Provider updates produce new immutable binding frames.
- Command intent emissions enter the runtime command buffer without embedding
  business logic callbacks in views.
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

DX-034B then landed explicit provider/scope metadata. The restraint remains the
same: `ProviderScope` says which providers are locally available, but it still
does not perform nearest-scope resolution, subscribe to backing sources,
invalidate views, or dispatch Commands.

DX-034C landed structural AppShell composition. It proves semantic slots and
nested block introspection, but still does not render AppShell or invent binding
lifecycle policy.

DX-034D formalized active binding lifecycle ownership before runtime code. The
important restraint is that active hierarchy, provider subscriptions,
invalidation, and command dispatch are runtime responsibilities; views still
receive immutable frames and emit intent only.

DX-034E landed binding lifecycle primitives as transition algebra. The restraint
is that lifecycle records are immutable facts, not managers: they do not
subscribe, refresh, dispatch, traverse the active hierarchy, render AppShell,
retain caches, or bind schemas.

DX-034F landed active binding collection primitives. The restraint is that
collections inspect declarations and produce active lifecycle ownership records;
they do not subscribe, refresh, dispatch, render, cache, resolve provider
scopes, traverse the real TUI runtime tree, bind schemas, or integrate DOGFOOD.

DX-034G landed active view-stack binding collection in `@flyingrobots/bijou-tui`.
The restraint is that the runtime stack only decides which declared binding
sources are active; it still does not render, subscribe, refresh, dispatch,
resolve provider handles, or retain caches.

DX-034H landed provider-update invalidation and frame assembly as a pure
contract helper. The restraint is that snapshot updates create new immutable
frames and lifecycle invalidation facts; no provider manager or subscription
loop exists yet.

DX-034I landed command intent emission and runtime command-buffer routing. The
restraint is that command routes map intent records to command values; business
logic still applies commands later through the existing runtime command buffer.

DX-034 is landed for the `v6.0.0` release boundary. The shipped release floor is
the explicit data-binding contract layer: immutable snapshots and frames,
provider scopes, view data contracts, structural AppShell composition, active
binding lifecycle facts, active runtime binding collection, provider-update
frame assembly, command intent routing, and closeout proof that a provider-bound
AppShell can render `navigation`, `content`, `inspector`, and `status` regions
from immutable binding frames without exposing provider, subscription, refresh,
or dispatch handles to rendered output.

Provider-bound AppShell proof is present in the DX-034 closeout cycle test. The
proof intentionally stays pure: provider subscriptions and cache policy remain
runtime/provider responsibilities, while the release contract proves the
boundary that views consume immutable frames and emit command intents.

DOGFOOD binding-state proof is present through the standard block story states
and Blocks preview lowering checks for ready, loading, stale, empty, and error
states. Broader production AppShell behavior can now build on the landed
contract without keeping issue #182 open.
