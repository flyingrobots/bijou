---
summary: "Anbieterneutrale Lokalisierungswerkzeuge für Austausch, Erkennung veralteter Einträge und Katalogkompilierung."
---

# @flyingrobots/bijou-i18n-tools

Workflow- und Autorenwerkzeuge für die Lokalisierung mit Bijou.

`@flyingrobots/bijou-i18n-tools` bietet:

- Typen für Autorenkataloge
- Erkennung veralteter Einträge über Quell-Hashes
- anbieterneutrale tabellarische Export-/Importzeilen
- tabellenfreundlichen Arbeitsmappen-Export/-Import
- Serialisierung und Parsen von CSV/TSV-Tabellen
- CSV/TSV-Import/-Export von Quell-String-Tabellen
- Generierung von Laufzeitkatalogen pro Locale aus String-Tabellen
- serialisierbaren Export/Import von Katalog-Bundles
- Serialisierung und Parsen von JSON-Bundles
- anbieterneutrale asynchrone Service-Adapter-Ports für den Austausch von Arbeitsmappen und Bundles
- typisierte Wertkodierung/-dekodierung für Strings, Daten und Referenzen
- Validierung und Normalisierung von Referenzen
- Kompilierung in Laufzeitkataloge von `@flyingrobots/bijou-i18n`
- Helfer für Pseudo-Lokalisierung

Dieses Paket ist bewusst anbieterneutral. Dateisystem-, XLSX- oder servicegestützte Adapter können darauf aufsetzen, ohne die Kern-API der Werkzeuge zu verunreinigen.

## Workflow mit String-Tabellen

Verwende die String-Tabellen-Helfer, wenn eine eingecheckte CSV/TSV-Datei die
Übersetzungsquelle sein soll und die Laufzeit jeweils eine ausgewählte Locale laden soll:

```typescript
import {
  parseStringTable,
  runtimeCatalogsForLocaleFromStringTable,
} from '@flyingrobots/bijou-i18n-tools';

const table = parseStringTable(csv, 'csv');
const catalogs = runtimeCatalogsForLocaleFromStringTable(table, 'fr');
```

Die generierten Laufzeitkataloge enthalten nur die Werte der ausgewählten Locale. Quell-
Strings bleiben in der String-Tabelle und im generierten Katalog der Quell-Locale.
Übersetzungen anderer Locales bleiben in der Quelltabelle und reisen nicht in der
Laufzeit-Nutzlast mit.

Servicegestützte Workflows können die eingebauten asynchronen Adapter-Ports nutzen, ohne
Details entfernter Dienste in den Werkzeugkern zu ziehen:

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

Konkrete Clients für Google Sheets oder andere entfernte Dienste sollten außerhalb dieses
Pakets leben und den Adapter-Vertrag auf Basis der vorhandenen Austauschformen für
Arbeitsmappen oder Bundles implementieren.

## Dokumentation

Im [Bijou-Repository](https://github.com/flyingrobots/bijou) findest du die vollständige Dokumentationsübersicht, den Architekturleitfaden und das Designsystem.
