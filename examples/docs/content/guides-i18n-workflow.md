# i18n Workflow

Bijou's localization workflow is split across runtime, pure tooling, and Node
filesystem adapters. The rule is simple:

```text
source string table
  -> generated per-locale runtime catalogs
  -> selected locale loaded by the runtime
```

Runtime code should not parse spreadsheets, CSV files, or all languages at
once. It should load the generated JSON catalogs for the selected language.
In Node, `createRuntimeCatalogDirectoryLoader()` reads that selected-locale
catalog directory for the i18n runtime.

## Package Roles

- `@flyingrobots/bijou-i18n`: runtime catalogs, locale switching, fallback
  lookup, direction, and formatting ports.
- `@flyingrobots/bijou-i18n-tools`: provider-neutral authoring tools for string
  tables, workbook exchange, stale detection, and runtime catalog generation.
- `@flyingrobots/bijou-i18n-tools-node`: Node filesystem helpers for reading
  string tables, writing generated runtime catalogs, and loading one locale
  directory.
- `@flyingrobots/bijou-i18n-tools-xlsx`: optional spreadsheet adapter package
  for XLSX workbook exchange.

## Source Table

Use one committed CSV or TSV string table as the authoring source. DOGFOOD's
current table lives at:

```text
examples/docs/i18n/source/dogfood-strings.csv
```

Each row names the namespace, string id, source locale, target locale,
translation status, and encoded value. Missing translations stay visible in the
table instead of disappearing into runtime fallback behavior.

## Build Runtime Catalogs

Generate runtime JSON catalogs from the source table:

```bash
npm run dogfood:i18n:build
npm run dogfood:i18n:check
```

DOGFOOD writes generated catalogs under:

```text
examples/docs/i18n/catalogs/<locale>/<namespace>.json
```

For example, French DOGFOOD strings are generated at:

```text
examples/docs/i18n/catalogs/fr/bijou.dogfood.json
```

That file contains English source values plus French translations only. It does
not carry Spanish, German, or every other language.

## Load One Locale

At runtime, load the selected locale directory:

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createRuntimeCatalogDirectoryLoader } from '@flyingrobots/bijou-i18n-tools-node';

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  loader: createRuntimeCatalogDirectoryLoader({
    rootDir: './i18n/catalogs',
  }),
});
```

Switching language should load the new locale's generated JSON catalogs and
replace the old selected-locale catalog payload. Views should ask the runtime
for localized strings; they should not read CSV, JSON files, process locale
state, or translation provider handles directly.

## Add A Language

1. Add the locale to the app's locale option list.
2. Add rows for that locale to the source string table.
3. Mark translated rows as `current`; keep missing rows as `missing`.
4. Run `npm run dogfood:i18n:build`.
5. Run `npm run dogfood:i18n:check` in CI or release readiness.
6. Run `npm run dogfood:i18n:coverage` to see translated and missing counts.

For provider or translator exchange, export workbooks from the same source:

```bash
npm run dogfood:i18n:export -- --locale fr --format csv
npm run dogfood:i18n:export -- --locale fr --format tsv --out /tmp/dogfood-fr
npm run dogfood:i18n:export -- --format json --bundle /tmp/dogfood-catalog.json
```

## Architecture Rules

- Keep localization behind runtime ports and adapters.
- Keep string-table conversion in `@flyingrobots/bijou-i18n-tools`.
- Keep filesystem reads and writes in `@flyingrobots/bijou-i18n-tools-node`.
- Keep runtime payloads selected-locale only.
- Keep views free of provider handles, filesystem reads, and CSV parsing.
