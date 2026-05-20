# @flyingrobots/bijou-i18n-tools

Workflow and authoring tooling for Bijou localization.

`@flyingrobots/bijou-i18n-tools` provides:

- authoring catalog types
- source-hash stale detection
- provider-neutral tabular export/import rows
- spreadsheet-friendly workbook export/import
- CSV/TSV sheet serialization and parsing
- source string-table CSV/TSV import/export
- per-locale runtime catalog generation from string tables
- serializable catalog-bundle export/import
- JSON bundle serialization and parsing
- provider-neutral async service adapter ports for workbook and bundle exchange
- typed value encoding/decoding for strings, data, and refs
- reference validation and normalization
- compilation into `@flyingrobots/bijou-i18n` runtime catalogs
- pseudo-localization helpers

This package is intentionally provider-neutral. Filesystem, XLSX, or service-backed adapters can sit on top of it without polluting the core tooling API.

## String Table Workflow

Use the string-table helpers when one committed CSV/TSV file should be the
translation source and runtime should load one selected locale at a time:

```typescript
import {
  parseStringTable,
  runtimeCatalogsForLocaleFromStringTable,
} from '@flyingrobots/bijou-i18n-tools';

const table = parseStringTable(csv, 'csv');
const catalogs = runtimeCatalogsForLocaleFromStringTable(table, 'fr');
```

The generated runtime catalogs include the source locale plus the selected
locale only. Other locale translations stay in the source table and do not ride
along in the runtime payload.

Service-backed workflows can use the built-in async adapter ports without
pulling remote service details into the tooling core:

```typescript
import { pushTranslationWorkbookToService, type ExchangeWorkbookServiceAdapter } from '@flyingrobots/bijou-i18n-tools';

const adapter: ExchangeWorkbookServiceAdapter = {
  pull: async () => ({ value: existingWorkbook, revision: 'rev-1' }),
  push: async (snapshot) => snapshot,
};

await pushTranslationWorkbookToService(adapter, catalogs, 'de', {
  revision: 'rev-1',
});
```

Concrete Google Sheets or other remote service clients should live outside this
package and implement the adapter contract on top of the existing workbook or
bundle exchange shapes.

## Documentation

See the [Bijou repo](https://github.com/flyingrobots/bijou) for the full documentation map, architecture guide, and design system.
