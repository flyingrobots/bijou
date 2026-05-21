# LX-019 — Localization Port Contract

Legend: [LX — Localization and Bidirectionality](../method/legends/LX-localization-and-bidirectionality.md)

## Why This Cycle Exists

Bijou already has a runtime catalog engine, formatter ports, catalog loaders,
string-table tooling, and DOGFOOD locale preference ports. Those pieces make
localization possible, but DOGFOOD still tends to pass the concrete i18n runtime
through rendering code and ask it for naked strings.

That is too low-level for the long-term architecture.

Views, blocks, and docs surfaces should ask an application-facing localization
port for a localized object:

```ts
const title = localization.resolve({
  key: { namespace: 'bijou.dogfood', id: 'blocks.preview.title' },
});
```

The result should preserve runtime truth:

- the requested key
- selected locale
- direction
- entry kind
- translated / fallback / missing status
- localized value
- issues and facts for tooling

The view should not know how catalogs were loaded, where JSON files live, which
CSV source produced them, or how fallback catalogs were attached.

## Core Rule

Localization in Bijou is a port/adapter boundary.

- Ports live where the localization vocabulary lives.
- Adapters live where the external dependency lives.
- Composition lives at the app boundary.
- Views receive localized objects, not filesystem, catalog, or runtime
  machinery.

## Boundary

This cycle is about the application-facing localization port contract and
DOGFOOD wiring.

It is not about:

- expanding translation coverage
- adding a localization dashboard
- adding a translation workbench
- changing the CSV string-table workflow
- loading every locale at runtime
- implementing remote localization services
- making blocks fetch localization data directly
- replacing the lower-level i18n runtime

## Vocabulary

### Localization Port

The app-facing port that resolves a localization request into a structured
localized object.

It should answer:

```text
Given this key and interpolation values, what localized object should this view
render in the selected locale?
```

It should not answer:

```text
Where are the catalog files?
How do I read the filesystem?
How do I compile CSV rows?
How do I persist locale preferences?
```

### Localized Object

The immutable result returned by the localization port.

It contains:

- key
- locale
- direction
- fallback locale
- entry kind
- resolution status
- value
- issues
- facts

The value may be a message string, data payload, or resource payload depending
on the catalog entry kind.

### Runtime Adapter

An adapter that wraps `I18nRuntime` and exposes it through
`LocalizationPort`.

The runtime continues to own catalog state, fallback behavior, locale switching,
references, and formatting. The port makes that behavior consumable by
application code without leaking the runtime surface everywhere.

Runtime convenience methods that remain public, such as `t()`, should behave
like stable API functions instead of receiver-sensitive object methods. Callers
may pass or destructure these helpers without preserving a JavaScript `this`
binding; the runtime state remains closure-owned at the adapter boundary.

### Node / Filesystem Adapters

Adapters that read selected-locale generated JSON catalogs from disk belong in
`@flyingrobots/bijou-i18n-tools-node` or application composition code.

They should return catalogs or construct runtime-backed localization ports.
They should not redefine the generic localization port contract.

## Package Split

The contract belongs in `@flyingrobots/bijou-i18n`:

```text
packages/bijou-i18n
  LocalizationPort
  LocalizationRequest
  LocalizedObject
  LocalizationStatus
  LocalizationIssue
  LocalizationFact
  createRuntimeLocalizationPort()
```

Node/file adapters stay in `@flyingrobots/bijou-i18n-tools-node`:

```text
packages/bijou-i18n-tools-node
  CSV and TSV string-table files
  generated runtime catalog JSON files
  selected-locale catalog directory loaders
```

DOGFOOD composition lives in `examples/docs`:

```text
examples/docs
  selected locale resolution
  English fallback catalog attachment
  development missing-marker policy
  runtime-backed LocalizationPort assembly
```

Views and block previews should receive the port or localized objects. They
should not receive filesystem loaders, CSV data, generated catalog paths, or
provider handles.

## Expected Flow

```text
CSV source string table
  -> generated per-locale JSON catalogs
  -> selected-locale catalog loader adapter
  -> I18nRuntime
  -> LocalizationPort
  -> LocalizedObject
  -> DOGFOOD / Blocks / shell surfaces
```

The fallback posture remains:

```text
production:
  selected locale value
  -> English fallback catalog

non-production:
  selected locale value
  -> loud missing-localization object
  -> English fallback only when missing markers are disabled
```

## DOGFOOD Implications

DOGFOOD should keep the concrete runtime at the composition boundary because the
frame shell still consumes `I18nRuntime` and the app still needs locale
activation. Ordinary DOGFOOD text lookup should move behind
`LocalizationPort.resolve()`.

The app may still hold both:

```ts
const runtime = createI18nRuntime(...);
const localization = createRuntimeLocalizationPort(runtime);
```

But render helpers should prefer:

```ts
localization.resolve({
  key: { namespace: 'bijou.dogfood', id: 'settings.language.label' },
});
```

over:

```ts
runtime.t({ namespace: 'bijou.dogfood', id: 'settings.language.label' });
```

## Acceptance Criteria

- `@flyingrobots/bijou-i18n` exports a first-class localization port contract.
- Runtime lookup helpers stay receiver-independent so app code can pass them
  around without binding `this`.
- The runtime adapter returns immutable localized objects.
- Localized objects preserve key, locale, direction, kind, status, value,
  issues, and facts.
- Missing selected-locale translations remain inspectable as missing
  localization results in non-production posture.
- Production fallback remains explicit through fallback catalogs.
- DOGFOOD text helpers use the localization port rather than direct runtime
  string lookups.
- DOGFOOD still keeps catalog loading and locale activation at the app
  composition boundary.

## Tests To Write First

- Port resolution returns a localized object for a translated message.
- Port resolution reports fallback status when selected-locale catalogs omit a
  value and fallback catalogs provide one.
- Port resolution reports missing status and marker value when missing-marker
  policy is enabled.
- Resource/data entries return localized object values without converting them
  to strings.
- Localized objects and their issue/fact arrays are immutable.
- DOGFOOD text lookup consumes `LocalizationPort` and does not call
  `I18nRuntime.t()` directly.

## Retrospective

Not started.
