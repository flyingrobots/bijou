---
summary: "Outillage de localisation indépendant du fournisseur pour l'échange, la détection des traductions obsolètes et la compilation des catalogues."
---
# @flyingrobots/bijou-i18n-tools

Outillage de flux de travail et de rédaction pour la localisation de Bijou.

`@flyingrobots/bijou-i18n-tools` fournit :

- des types de catalogues de rédaction
- la détection des traductions obsolètes par hachage de la source
- des lignes tabulaires d'export/import indépendantes du fournisseur
- l'export/import de classeurs adaptés aux feuilles de calcul
- la sérialisation et l'analyse de feuilles CSV/TSV
- l'import/export CSV/TSV de tables de chaînes source
- la génération de catalogues du runtime par locale à partir de tables de chaînes
- l'export/import de bundles de catalogues sérialisables
- la sérialisation et l'analyse de bundles JSON
- des ports d'adaptateurs de services asynchrones indépendants du fournisseur pour l'échange de classeurs et de bundles
- l'encodage/décodage typé des valeurs pour les chaînes, les données et les références
- la validation et la normalisation des références
- la compilation en catalogues du runtime `@flyingrobots/bijou-i18n`
- des utilitaires de pseudo-localisation

Ce package est volontairement indépendant du fournisseur. Des adaptateurs pour le système de fichiers, XLSX ou des services peuvent s'appuyer dessus sans polluer l'API centrale de l'outillage.

## Flux de travail des tables de chaînes

Utilisez les utilitaires de tables de chaînes lorsqu'un seul fichier CSV/TSV
versionné doit servir de source de traduction et que le runtime doit charger une
seule locale sélectionnée à la fois :

```typescript
import {
  parseStringTable,
  runtimeCatalogsForLocaleFromStringTable,
} from '@flyingrobots/bijou-i18n-tools';

const table = parseStringTable(csv, 'csv');
const catalogs = runtimeCatalogsForLocaleFromStringTable(table, 'fr');
```

Les catalogues du runtime générés n'incluent que les valeurs de la locale
sélectionnée. Les chaînes source restent dans la table de chaînes et dans le
catalogue généré de la locale source. Les traductions des autres locales restent
dans la table source et ne sont pas embarquées dans le contenu du runtime.

Les flux de travail adossés à des services peuvent utiliser les ports
d'adaptateurs asynchrones intégrés sans introduire les détails des services
distants dans le cœur de l'outillage :

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

Les clients concrets pour Google Sheets ou d'autres services distants doivent
vivre en dehors de ce package et implémenter le contrat d'adaptateur par-dessus
les formes d'échange de classeurs ou de bundles existantes.

## Documentation

Consultez le [dépôt Bijou](https://github.com/flyingrobots/bijou) pour la carte complète de la documentation, le guide d'architecture et le design system.
