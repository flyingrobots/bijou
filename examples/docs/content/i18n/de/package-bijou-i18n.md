---
title: "@flyingrobots/bijou-i18n"
summary: "Die In-Memory-Lokalisierungslaufzeit für Kataloge, Schreibrichtung und laufzeitsichere Abfragen."
---
# @flyingrobots/bijou-i18n

Die In-Memory-Lokalisierungslaufzeit für Bijou.

`@flyingrobots/bijou-i18n` bietet:

- Kataloge mit Namensräumen
- Locale und Schreibrichtung
- Nachrichtenabfrage
- generische Ressourcenabfrage
- laufzeitsichere Referenzen
- locale-bewusste Formatierungsnahtstellen
- explizite Fallback-Kataloge
- injizierbare Formatierung für Meldungen bei fehlender Lokalisierung
- Unterstützung asynchroner Locale-Loader für die laufzeitintegrierte Katalogaktivierung
- einen anwendungsseitigen `LocalizationPort`, der strukturierte lokalisierte
  Objekte auflöst
- `isJsonShapedLocalizedValue()` für adapterseitige Konformitätsprüfungen von
  Ressourcen- und Daten-Payloads

Dieses Paket ist bewusst nur Laufzeit. Tabellen-Workflows, Erkennung veralteter Einträge, Pseudolokalisierung und Katalogkompilierung gehören in `@flyingrobots/bijou-i18n-tools`.

## Loader-Nahtstelle

Verwende `createI18nRuntime()` für vollständig vorab geladene Kataloge oder
`createI18nRuntimeAsync()`, wenn Kataloge verzögert geladen werden müssen:

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

Werden Laufzeit-Payloads als reine Kataloge pro Locale erzeugt, lade den Quell-
oder Fallback-Katalog separat:

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

Produktive Apps können Fallback-Kataloge für lesbare fehlende Übersetzungen nutzen.
Entwicklungs-Apps können `missingMessage` injizieren, um eine auffällige Markierung zu
rendern, statt still zurückzufallen, wenn der gewählten Locale ein String fehlt:

```ts
const runtime = createI18nRuntime({
  locale: 'fr',
  direction: 'ltr',
  fallbackLocale: 'en',
  fallbackCatalogs: [englishCatalog],
  missingMessage: ({ key }) => `<MISSING LOC STRING KEY=${key.namespace}:${key.id}>`,
});
```

Dieselbe Loader-Nahtstelle unterstützt über
`@flyingrobots/bijou-i18n-tools-node` auch dateibasierte Locale-Bundles:

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

Einmal erstellt, kann die Laufzeit Locales explizit vorab laden und aktivieren:

```ts
await runtime.preloadLocale('de');
await runtime.setLocale('de');
```

## Lokalisierungs-Port

Verwende `LocalizationPort` an Anwendungs- und View-Grenzen, wenn Aufrufer ein
lokalisiertes Objekt statt einer konkreten Laufzeit brauchen:

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

const title = localization.resolve({
  key: { namespace: 'app', id: 'title' },
});
```

`resolve()` gibt ein eingefrorenes lokalisiertes Objekt mit Schlüssel, Locale,
Schreibrichtung, Eintragsart, Status (übersetzt/Fallback/fehlend), Wert, Problemen und
Fakten zurück. So bleibt Render-Code fern von Katalogladen, Dateisystempfaden,
CSV-Daten und Details der Laufzeitmutation, während genug Zustand für Werkzeuge und
niedrigere Modi erhalten bleibt.

## Ressourcen- und Daten-Payloads

Nachrichteneinträge werden zu Strings aufgelöst. `resource`- und `data`-Einträge
werden zu portablen strukturierten Werten aufgelöst, und die Laufzeit friert diese
Werte ein, bevor sie sie an Aufrufer übergibt.

Halte Ressourcen- und Daten-Payloads JSON-förmig:

- Strings, Zahlen, Booleans, null und undefined
- Arrays nur mit indizierten Einträgen
- einfache Objekte nur mit aufzählbaren Dateneigenschaften

Verwende nicht:

- Klasseninstanzen oder eingebaute Objekte wie `Date`
- Eigenschaften mit Symbol-Schlüsseln
- nicht aufzählbare Eigenschaften
- Accessor-Eigenschaften
- zyklische Objektgraphen
- Funktionen, Symbole oder BigInt-Werte

Nicht unterstützte Formen werden an der Lokalisierungsgrenze abgewiesen, statt still
normalisiert zu werden. Das hält generierte Kataloge, Laufzeit-Loader-Adapter und
View-Code ehrlich: Adapter müssen portable Daten erzeugen, und Konsumenten können
darauf vertrauen, dass lokalisierte Ressourcen- und Datenwerte unveränderliche
Momentaufnahmen sind statt veränderlicher Laufzeit-Handles.

Adapter können Payloads prüfen, bevor sie Kataloge bauen:

```ts
import { isJsonShapedLocalizedValue } from '@flyingrobots/bijou-i18n';

if (!isJsonShapedLocalizedValue(payload)) {
  throw new Error('i18n resource/data payload must be JSON-shaped');
}
```

Gültige Ressourcen- und Daten-Payloads sind dichte, einfache Daten:

```ts
const validResource = {
  label: 'Counter',
  range: { min: 0, max: 10 },
  marks: ['empty', 'half', 'full'],
};
```

Ungültige Payloads werden abgewiesen, statt still normalisiert zu werden:

```ts
class CounterResource {
  readonly label = 'Counter';
}

const sparse = new Array<string>(2);
sparse[1] = 'full';

const accessor = Object.defineProperty({}, 'label', {
  enumerable: true,
  get() {
    return 'Counter';
  },
});

isJsonShapedLocalizedValue(new CounterResource()); // false
isJsonShapedLocalizedValue(sparse); // false
isJsonShapedLocalizedValue(accessor); // false
```

## Dokumentation

Im [Bijou-Repo](https://github.com/flyingrobots/bijou) findest du die vollständige Dokumentationsübersicht, den Architekturleitfaden und das Design-System.
