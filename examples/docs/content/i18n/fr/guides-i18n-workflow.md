---
title: "Flux de travail @flyingrobots/bijou-i18n"
summary: "@flyingrobots/bijou-i18n-tools + @flyingrobots/bijou-i18n-tools-node"
---
# Flux de travail i18n

Le flux de localisation de Bijou est réparti entre le runtime, un outillage pur
et des adaptateurs de système de fichiers Node. La règle est simple :

```text
source string table
  -> generated per-locale runtime catalogs
  -> English fallback catalog plus selected locale loaded by the runtime
  -> runtime-backed LocalizationPort
  -> localized objects consumed by views
```

Le code du runtime ne doit pas analyser de feuilles de calcul, de fichiers CSV ni
toutes les langues à la fois. En production, il faut charger le catalogue anglais
généré comme repli, puis les catalogues JSON générés pour la langue
sélectionnée. Sous Node, `createRuntimeCatalogDirectoryLoader()` lit ce
répertoire de catalogues de la locale sélectionnée pour le runtime i18n.

## Rôles des packages

- `@flyingrobots/bijou-i18n` : catalogues du runtime, changement de locale,
  recherche avec repli, direction, ports de formatage et contrat
  `LocalizationPort` destiné aux applications.
- `@flyingrobots/bijou-i18n-tools` : outils de création indépendants du
  fournisseur pour les tables de chaînes, l'échange de classeurs, la détection
  des traductions obsolètes et la génération des catalogues du runtime.
- `@flyingrobots/bijou-i18n-tools-node` : utilitaires de système de fichiers Node
  pour lire les tables de chaînes, écrire les catalogues du runtime générés et
  charger le répertoire d'une locale.
- `@flyingrobots/bijou-i18n-tools-xlsx` : package d'adaptateur de feuille de
  calcul facultatif pour l'échange de classeurs XLSX.

## Table source

Utilisez une seule table de chaînes CSV ou TSV versionnée comme source de
rédaction. La table actuelle de DOGFOOD se trouve ici :

```text
examples/docs/i18n/source/dogfood-strings.csv
```

Chaque ligne indique l'espace de noms, l'identifiant de la chaîne, la locale
source, la locale cible, le statut de traduction et la valeur encodée. Les
traductions manquantes restent visibles dans la table au lieu de disparaître dans
le comportement de repli du runtime.

## Générer les catalogues du runtime

Générez les catalogues JSON du runtime à partir de la table source :

```bash
npm run dogfood:i18n:build
npm run dogfood:i18n:check
```

DOGFOOD écrit les catalogues générés sous :

```text
examples/docs/i18n/catalogs/<locale>/<namespace>.json
```

Par exemple, les chaînes françaises de DOGFOOD sont générées dans :

```text
examples/docs/i18n/catalogs/fr/bijou.dogfood.json
```

Ce fichier ne contient que des valeurs françaises. Les valeurs source anglaises
restent dans la table source et dans le catalogue anglais généré du runtime. Il
ne contient ni l'espagnol, ni l'allemand, ni aucune autre langue.

## Charger une seule locale

Au runtime, chargez le répertoire de la locale sélectionnée :

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

Changer de langue doit charger les catalogues JSON générés de la nouvelle locale
et remplacer le contenu du catalogue de l'ancienne locale sélectionnée. La
composition de l'application peut conserver le runtime pour activer des
catalogues, mais les vues doivent utiliser un `LocalizationPort` et recevoir des
objets localisés. Elles ne doivent pas lire directement de fichiers CSV ou JSON,
l'état de locale du processus ni des handles de fournisseur de traduction.

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

Dans les builds hors production, les chaînes manquantes pour la locale
sélectionnée doivent être bien visibles plutôt que silencieusement lisibles.
DOGFOOD utilise un marqueur voyant de localisation manquante pour ce cas :

```text
<MISSING LOC STRING KEY=bijou.dogfood:docs.page.guides>
```

Les builds de production gardent les catalogues de repli anglais chargés afin
que les traductions incomplètes produisent toujours une interface lisible.

## Ajouter une langue

1. Ajoutez la locale à la liste des options de locale de l'application.
2. Ajoutez des lignes pour cette locale dans la table de chaînes source.
3. Marquez les lignes traduites comme `current` ; laissez les lignes manquantes en `missing`.
4. Exécutez `npm run dogfood:i18n:build`.
5. Exécutez `npm run dogfood:i18n:check` en CI ou lors de la préparation d'une version.
6. Exécutez `npm run dogfood:i18n:coverage` pour voir le nombre de chaînes traduites et manquantes.

Pour les échanges avec un fournisseur ou un traducteur, exportez des classeurs à
partir de la même source :

```bash
npm run dogfood:i18n:export -- --locale fr --format csv
npm run dogfood:i18n:export -- --locale fr --format tsv --out /tmp/dogfood-fr
npm run dogfood:i18n:export -- --format json --bundle /tmp/dogfood-catalog.json
```

## Règles d'architecture

- Gardez la localisation derrière des ports et des adaptateurs du runtime.
- Résolvez les textes des applications et des vues via `LocalizationPort`, et non
  par des recherches directes de chaînes dans le runtime.
- Gardez la conversion des tables de chaînes dans `@flyingrobots/bijou-i18n-tools`.
- Gardez les lectures et écritures du système de fichiers dans `@flyingrobots/bijou-i18n-tools-node`.
- Limitez les contenus du runtime à la seule locale sélectionnée.
- Gardez le repli anglais chargé séparément en production.
- Gardez les chaînes manquantes de la locale sélectionnée bien visibles en développement.
- Gardez les vues exemptes de handles de fournisseur, de lectures du système de fichiers et d'analyse CSV.
