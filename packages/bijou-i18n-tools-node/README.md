# @flyingrobots/bijou-i18n-tools-node

Node filesystem helpers for Bijou localization exchange workflows.

`@flyingrobots/bijou-i18n-tools-node` builds on `@flyingrobots/bijou-i18n-tools` and provides:

- reading and writing CSV/TSV exchange sheet files
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

## Documentation

See the [Bijou repo](https://github.com/flyingrobots/bijou) for the full documentation map, architecture guide, and design system.
