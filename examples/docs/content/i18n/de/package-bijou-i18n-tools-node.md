---
summary: "Node-Dateisystemadapter für Lokalisierungs-Austauschworkflows und Bundle-Dateien."
---
# @flyingrobots/bijou-i18n-tools-node

Node-Dateisystemhelfer für Bijous Lokalisierungs-Austauschworkflows.

`@flyingrobots/bijou-i18n-tools-node` baut auf `@flyingrobots/bijou-i18n-tools` auf und bietet:

- Lesen und Schreiben von CSV/TSV-Austauschtabellen
- Lesen und Schreiben von CSV/TSV-Dateien mit Quell-String-Tabellen
- Erzeugen von Laufzeitkatalog-JSON-Dateien pro Locale
- Laden eines ausgewählten Locale-Verzeichnisses mit Laufzeitkatalog-JSON-Dateien
- Lesen und Schreiben von JSON-Katalog-Bundle-Dateien
- Lesen und Schreiben von Arbeitsmappenverzeichnissen mit versioniertem Manifest
- erweiterungsbasierte Formaterkennung für `.csv`, `.tsv` und `.json`
- einen Node-Loader-Adapter für Katalog-Bundles für `@flyingrobots/bijou-i18n`

Dieses Paket hält Node- und Dateibelange bewusst aus dem reinen Paket `@flyingrobots/bijou-i18n-tools` heraus.

## Laufzeit-Loader

`createCatalogBundleFileLoader()` macht aus nach Locale geschlüsselten Bundle-Dateien
einen Laufzeit-Loader für `createI18nRuntimeAsync()`:

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

Damit erhält Bijou einen eingebauten Node-Dateiladepfad, ohne die Kernlaufzeit direkt
an Dateisystem-APIs zu koppeln.

Für generierte Laufzeitkataloge pro Locale nutze den Verzeichnis-Loader:

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

Der Loader liest für die ausgewählte Locale nur `./i18n/catalogs/fr/*.json`.
Für produktives Fallback-Verhalten lade `./i18n/catalogs/en/*.json` als explizite
Fallback-Kataloge über `createI18nRuntime({ fallbackCatalogs })` und lass den
Verzeichnis-Loader nur für die aktive ausgewählte Locale zuständig sein.

## Dokumentation

Im [Bijou-Repo](https://github.com/flyingrobots/bijou) findest du die vollständige Dokumentationsübersicht, den Architekturleitfaden und das Design-System.
