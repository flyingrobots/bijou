# @flyingrobots/bijou-i18n-tools-node

Node filesystem helpers for Bijou localization exchange workflows.

`@flyingrobots/bijou-i18n-tools-node` builds on `@flyingrobots/bijou-i18n-tools` and provides:

- reading and writing CSV/TSV exchange sheet files
- reading and writing source string-table CSV/TSV files
- generating per-locale runtime catalog JSON files
- loading one selected locale directory of runtime catalog JSON files
- reading and writing JSON catalog bundle files
- reading and writing workbook directories with a versioned manifest
- extension-based format inference for `.csv`, `.tsv`, and `.json`
- a Node catalog-bundle loader adapter for `@flyingrobots/bijou-i18n`

This package intentionally keeps Node/file concerns out of the pure `@flyingrobots/bijou-i18n-tools` package.

## Runtime Loader

`createCatalogBundleFileLoader()` turns locale-keyed bundle files into a
runtime loader for `createI18nRuntimeAsync()`:

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

That gives Bijou a built-in Node file-loader path without coupling the
core runtime to filesystem APIs directly.

For generated per-locale runtime catalogs, use the directory loader:

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createRuntimeCatalogDirectoryLoader } from '@flyingrobots/bijou-i18n-tools-node';

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader: createRuntimeCatalogDirectoryLoader({
    rootDir: './i18n/catalogs',
  }),
});
```

The loader reads only `./i18n/catalogs/fr/*.json` for the selected locale.
For production fallback behavior, load `./i18n/catalogs/en/*.json` as explicit
fallback catalogs through `createI18nRuntime({ fallbackCatalogs })` and keep the
directory loader responsible only for the active selected locale.

## Documentation

See the [Bijou repo](https://github.com/flyingrobots/bijou) for the full documentation map, architecture guide, and design system.
