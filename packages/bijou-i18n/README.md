# @flyingrobots/bijou-i18n

The in-memory localization runtime for Bijou.

`@flyingrobots/bijou-i18n` provides:

- namespaced catalogs
- locale and direction
- message lookup
- generic resource lookup
- runtime-safe references
- locale-aware formatting seams
- explicit fallback catalogs
- injectable missing-localization message formatting
- async locale loader support for runtime-integrated catalog activation
- an application-facing `LocalizationPort` that resolves structured localized
  objects

This package is intentionally runtime-only. Spreadsheet workflows, stale detection, pseudo-localization, and catalog compilation belong in `@flyingrobots/bijou-i18n-tools`.

## Loader Seam

Use `createI18nRuntime()` for fully preloaded catalogs, or
`createI18nRuntimeAsync()` when catalogs need to be loaded lazily:

```ts
import { createI18nRuntimeAsync, type I18nCatalogLoader } from '@flyingrobots/bijou-i18n';

const loader: I18nCatalogLoader = async (locale) => {
  const module = await import(`./catalogs/${locale}.js`);
  return module.catalogs;
};

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader,
});
```

When runtime payloads are generated as pure per-locale catalogs, load the source
or fallback catalog separately:

```ts
import { createI18nRuntime } from '@flyingrobots/bijou-i18n';

const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  catalogs: [frenchCatalog],
});
```

Production apps can use fallback catalogs for readable missing translations.
Development apps can inject `missingMessage` to render a loud marker instead of
quietly falling back when the selected locale is missing a string:

```ts
const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  missingMessage: ({ key }) => `<MISSING LOC STRING KEY=${key.namespace}:${key.id}>`,
});
```

The same loader seam also supports file-backed locale bundles through
`@flyingrobots/bijou-i18n-tools-node`:

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createCatalogBundleFileLoader } from '@flyingrobots/bijou-i18n-tools-node';

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader: createCatalogBundleFileLoader({
    resolvePath: (locale) => `./i18n/${locale}.json`,
  }),
});
```

Once created, the runtime can preload and activate locales explicitly:

```ts
await runtime.preloadLocale('de');
await runtime.setLocale('de');
```

## Localization Port

Use `LocalizationPort` at application and view boundaries when callers need a
localized object instead of a concrete runtime:

```ts
import {
  createI18nRuntime,
  createRuntimeLocalizationPort,
} from '@flyingrobots/bijou-i18n';

const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  catalogs: [frenchCatalog],
});
const localization = createRuntimeLocalizationPort(runtime);

const title = localization.resolve<string>({
  key: { namespace: 'app', id: 'title' },
});
```

`resolve()` returns a frozen localized object with the key, locale, direction,
entry kind, translated/fallback/missing status, value, issues, and facts. That
keeps rendering code away from catalog loading, filesystem paths, CSV data, and
runtime mutation details while preserving enough state for tooling and lower
modes.

## Resource And Data Payloads

Message entries resolve to strings. `resource` and `data` entries resolve to
portable structured values, and the runtime freezes those values before handing
them to callers.

Keep resource/data payloads JSON-shaped:

- strings, numbers, booleans, null, and undefined
- arrays with indexed entries only
- plain objects with enumerable data properties only

Do not use:

- class instances or built-ins such as `Date`
- symbol-keyed properties
- non-enumerable properties
- accessor properties
- cyclic object graphs
- functions, symbols, or bigint values

Unsupported shapes are rejected at the localization boundary rather than being
silently normalized. This keeps generated catalogs, runtime loader adapters, and
view code honest: adapters must produce portable data, and consumers can trust
that localized resource/data values are immutable snapshots rather than mutable
runtime handles.

## Documentation

See the [Bijou repo](https://github.com/flyingrobots/bijou) for the full documentation map, architecture guide, and design system.
