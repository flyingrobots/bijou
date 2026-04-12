# @flyingrobots/bijou-i18n

The in-memory localization runtime for Bijou.

`@flyingrobots/bijou-i18n` provides:

- namespaced catalogs
- locale and direction
- message lookup
- generic resource lookup
- runtime-safe references
- locale-aware formatting seams
- async locale loader support for runtime-integrated catalog activation

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

## Documentation

See the [Bijou repo](https://github.com/flyingrobots/bijou) for the full documentation map, architecture guide, and design system.
