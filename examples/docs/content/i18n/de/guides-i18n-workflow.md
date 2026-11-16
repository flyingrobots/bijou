---
title: "Workflow für @flyingrobots/bijou-i18n"
summary: "@flyingrobots/bijou-i18n-tools + @flyingrobots/bijou-i18n-tools-node"
---
# i18n-Workflow

Bijous Lokalisierungs-Workflow ist auf Laufzeit, reine Werkzeuge und Node-
Dateisystemadapter aufgeteilt. Die Regel ist einfach:

```text
source string table
  -> generated per-locale runtime catalogs
  -> English fallback catalog plus selected locale loaded by the runtime
  -> runtime-backed LocalizationPort
  -> localized objects consumed by views
```

Laufzeitcode sollte keine Tabellenkalkulationen, CSV-Dateien oder alle Sprachen auf
einmal parsen. In Produktion sollte der generierte englische Katalog als Fallback geladen
werden und danach die generierten JSON-Kataloge der ausgewählten Sprache. In Node
liest `createRuntimeCatalogDirectoryLoader()` dieses Katalogverzeichnis der ausgewählten
Locale für die i18n-Laufzeit.

## Rollen der Pakete

- `@flyingrobots/bijou-i18n`: Laufzeitkataloge, Locale-Wechsel, Fallback-
  Suche, Schreibrichtung, Formatierungs-Ports und der app-seitige Vertrag
  `LocalizationPort`.
- `@flyingrobots/bijou-i18n-tools`: anbieterneutrale Autorenwerkzeuge für String-
  Tabellen, Arbeitsmappenaustausch, Erkennung veralteter Einträge und Generierung von Laufzeitkatalogen.
- `@flyingrobots/bijou-i18n-tools-node`: Node-Dateisystemhelfer zum Lesen von
  String-Tabellen, Schreiben generierter Laufzeitkataloge und Laden eines Locale-
  Verzeichnisses.
- `@flyingrobots/bijou-i18n-tools-xlsx`: optionales Tabellenkalkulations-Adapterpaket
  für den Austausch von XLSX-Arbeitsmappen.

## Quelltabelle

Verwende eine eingecheckte CSV- oder TSV-String-Tabelle als Autorenquelle. Die
aktuelle Tabelle von DOGFOOD liegt unter:

```text
examples/docs/i18n/source/dogfood-strings.csv
```

Jede Zeile nennt Namespace, String-ID, Quell-Locale, Ziel-Locale,
Übersetzungsstatus und kodierten Wert. Fehlende Übersetzungen bleiben in der
Tabelle sichtbar, statt im Fallback-Verhalten der Laufzeit zu verschwinden.

## Laufzeitkataloge bauen

Generiere JSON-Laufzeitkataloge aus der Quelltabelle:

```bash
npm run dogfood:i18n:build
npm run dogfood:i18n:check
```

DOGFOOD schreibt generierte Kataloge nach:

```text
examples/docs/i18n/catalogs/<locale>/<namespace>.json
```

Französische DOGFOOD-Strings werden zum Beispiel hier generiert:

```text
examples/docs/i18n/catalogs/fr/bijou.dogfood.json
```

Diese Datei enthält nur französische Werte. Englische Quellwerte bleiben in der Quell-
tabelle und im generierten englischen Laufzeitkatalog. Sie enthält weder Spanisch
noch Deutsch noch irgendeine andere Sprache.

## Eine Locale laden

Lade zur Laufzeit das Verzeichnis der ausgewählten Locale:

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createRuntimeCatalogDirectoryLoader } from '@flyingrobots/bijou-i18n-tools-node';

const loader = createRuntimeCatalogDirectoryLoader({
  rootDir: './i18n/catalogs',
});
const englishCatalogs = await loader('en');

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: englishCatalogs,
  loader,
});
```

Ein Sprachwechsel sollte die generierten JSON-Kataloge der neuen Locale laden und
die bisherige Katalog-Nutzlast der ausgewählten Locale ersetzen. Die App-Komposition kann die
Laufzeit behalten, um Kataloge zu aktivieren, aber Views sollten einen `LocalizationPort`
verwenden und lokalisierte Objekte erhalten. Sie sollten weder CSV- noch JSON-Dateien lesen, keinen
Locale-Zustand verarbeiten und nicht direkt auf Handles von Übersetzungsanbietern zugreifen.

```ts
import {
  createRuntimeLocalizationPort,
  type LocalizationPort,
} from '@flyingrobots/bijou-i18n';

const localization: LocalizationPort = createRuntimeLocalizationPort(runtime);
const labelResult = localization.resolve({
  key: { namespace: 'bijou.dogfood', id: 'settings.language.label' },
});
const label = labelResult.value ?? 'Language';
```

In Nicht-Produktions-Builds sollten fehlende Strings der ausgewählten Locale auffallen, statt
stillschweigend lesbar zu bleiben. DOGFOOD verwendet dafür eine grelle Markierung für
fehlende Lokalisierung:

```text
<MISSING LOC STRING KEY=bijou.dogfood:docs.page.guides>
```

Produktions-Builds halten die englischen Fallback-Kataloge geladen, damit unvollständige
Übersetzungen trotzdem eine lesbare Oberfläche rendern.

## Eine Sprache hinzufügen

1. Füge die Locale zur Locale-Optionsliste der App hinzu.
2. Füge Zeilen für diese Locale zur Quell-String-Tabelle hinzu.
3. Markiere übersetzte Zeilen als `current`; lass fehlende Zeilen auf `missing`.
4. Führe `npm run dogfood:i18n:build` aus.
5. Führe `npm run dogfood:i18n:check` in der CI oder bei der Release-Vorbereitung aus.
6. Führe `npm run dogfood:i18n:coverage` aus, um die Anzahl übersetzter und fehlender Einträge zu sehen.

Für den Austausch mit Anbietern oder Übersetzern exportierst du Arbeitsmappen aus derselben Quelle:

```bash
npm run dogfood:i18n:export -- --locale fr --format csv
npm run dogfood:i18n:export -- --locale fr --format tsv --out /tmp/dogfood-fr
npm run dogfood:i18n:export -- --format json --bundle /tmp/dogfood-catalog.json
```

## Architekturregeln

- Halte Lokalisierung hinter Laufzeit-Ports und Adaptern.
- Löse App-/View-Texte über `LocalizationPort` auf, nicht über direkte String-
  Abfragen an der Laufzeit.
- Halte die Konvertierung von String-Tabellen in `@flyingrobots/bijou-i18n-tools`.
- Halte Lese- und Schreibzugriffe auf das Dateisystem in `@flyingrobots/bijou-i18n-tools-node`.
- Halte Laufzeit-Nutzlasten auf die ausgewählte Locale beschränkt.
- Lade den englischen Fallback in Produktion separat.
- Lass fehlende Strings der ausgewählten Locale in der Entwicklung visuell auffallen.
- Halte Views frei von Provider-Handles, Dateisystemzugriffen und CSV-Parsing.
