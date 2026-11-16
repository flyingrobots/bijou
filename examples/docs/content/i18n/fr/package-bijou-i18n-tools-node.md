---
summary: "Adaptateurs Node de système de fichiers pour les flux d’échange de localisation et les fichiers de bundle."
---
# @flyingrobots/bijou-i18n-tools-node

Utilitaires Node de système de fichiers pour les flux d’échange de localisation de Bijou.

`@flyingrobots/bijou-i18n-tools-node` s’appuie sur `@flyingrobots/bijou-i18n-tools` et fournit :

- la lecture et l’écriture de fichiers de feuilles d’échange CSV/TSV
- la lecture et l’écriture de fichiers CSV/TSV de tables de chaînes sources
- la génération de fichiers JSON de catalogues d’exécution par locale
- le chargement d’un répertoire de locale sélectionné contenant des fichiers JSON de catalogues d’exécution
- la lecture et l’écriture de fichiers de bundles de catalogues JSON
- la lecture et l’écriture de répertoires de classeurs avec un manifeste versionné
- l’inférence du format d’après l’extension pour `.csv`, `.tsv` et `.json`
- un adaptateur Node de chargement de bundles de catalogues pour `@flyingrobots/bijou-i18n`

Ce paquet tient volontairement les préoccupations Node et fichiers à l’écart du paquet pur `@flyingrobots/bijou-i18n-tools`.

## Chargeur d’exécution

`createCatalogBundleFileLoader()` transforme des fichiers de bundle indexés par locale en
chargeur d’exécution pour `createI18nRuntimeAsync()` :

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

Bijou dispose ainsi d’un chemin intégré de chargement de fichiers sous Node sans coupler
directement le runtime du cœur aux API du système de fichiers.

Pour les catalogues d’exécution générés par locale, utilisez le chargeur de répertoire :

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

Le chargeur ne lit que `./i18n/catalogs/fr/*.json` pour la locale sélectionnée.
Pour le comportement de repli en production, chargez `./i18n/catalogs/en/*.json` comme catalogues
de repli explicites via `createI18nRuntime({ fallbackCatalogs })` et laissez au
chargeur de répertoire la seule responsabilité de la locale active sélectionnée.

## Documentation

Consultez le [dépôt Bijou](https://github.com/flyingrobots/bijou) pour la carte complète de la documentation, le guide d’architecture et le système de design.
