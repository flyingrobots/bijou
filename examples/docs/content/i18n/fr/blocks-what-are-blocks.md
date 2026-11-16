---
title: "Qu’est-ce qu’un Block"
summary: "La posture du système de design pour les assemblages Bijou plus vastes et plus affirmés."
---
# Blocks

Ce document définit ce que Bijou entend par Block réutilisable.

Les Blocks sont des assemblages plus vastes et plus affirmés, construits à partir de modèles canoniques et de familles de composants.

## Ce qu’est un Block

Un Block n’est pas :

- une composition de démonstration ponctuelle
- un composant primitif isolé
- un bricolage propre à un shell que seule une surface de mise à l’épreuve comprend

Un Block est :

- un assemblage réutilisable au niveau du produit
- composé à partir de modèles canoniques
- construit à partir des familles de composants existantes et des règles de propriété de la TUI
- documenté avec des rôles, une propriété et des attentes d’abaissement clairs

Les Blocks viennent après la doctrine, les modèles et les composants.

Cet ordre compte :

1. la doctrine explique quel ressenti doit procurer une bonne UX Bijou
2. les modèles expliquent le langage d’interaction récurrent
3. les familles de composants fournissent des primitives réutilisables
4. les Blocks composent ces primitives en structures produit reproductibles

Si un Block apparaît avant que les trois premières couches soient claires, il fige généralement un goût accidentel au lieu d’un langage réutilisable.

## Ce que les Blocks doivent standardiser

Les Blocks doivent standardiser :

- la composition
- la structure
- le rythme rédactionnel
- la propriété du focus
- les possibilités courantes du shell ou des flux de travail

Les Blocks ne doivent pas masquer :

- la propriété des interactions importantes
- le comportement d’abaissement
- la sémantique d’accessibilité
- les hypothèses de localisation ou de sens d’écriture

## Contrat public actuel

Bijou expose désormais depuis `@flyingrobots/bijou` un contrat de création de Blocks
fondé d’abord sur les métadonnées :

- `BlockMetadata` déclare le paquet, le nom, la famille, l’échelle, les modes, les emplacements,
  les variantes, les options de configuration, les composants assemblés, les faits sémantiques, les identifiants de stories et la
  documentation d’un Block.
- `BlockDefinition` associe ces métadonnées à une fonction de rendu explicite.
- `BlockPackageManifest` déclare les Blocks exportés, la version du paquet, la plage de
  dépendance pair de Bijou, la documentation et les étiquettes pour une distribution NPM ordinaire.
- `defineBlock()` et `defineBlockPackage()` valident les définitions avant que
  les auteurs ne les publient ou ne les indexent.
- `defineBlock()` peut joindre des contrats de données de vue DX-034 et des intentions de commande pour
  la découverte, sans poignées de fournisseur ni rappels de commande.
- `appShellBlock`, `readerSurfaceBlock`, `inspectorPanelBlock`,
  `inlineStatusBlock`, `inFlowStatusBlock`, `transientOverlayBlock`,
  `activityStreamBlock`, `shortcutCueBlock`, `progressIndicatorBlock`,
  les exports de Blocks par famille de composants de DOGFOOD, `standardBlocks`,
  `standardBlockStories` et
  `standardBlockPackageManifest` exposent les définitions de Blocks internes :
  AppShell, ReaderSurface, InspectorPanel, état en ligne, état dans le flux,
  retour par superposition éphémère, flux d’activité, indications de raccourci, progression,
  regroupement, explicabilité, documents, liens, séparateurs, saisie de texte, choix,
  navigation, divulgation, progression de parcours, mise en valeur de marque, primitives sensibles au mode,
  comparaisons denses, hiérarchies, listes d’exploration et vues de dépendances
  temporelles.
  Leurs fonctions de rendu produisent désormais une première sortie de preuve déterministe dans les modes
  `interactive`, `static`, `pipe` et `accessible`, tout en maintenant le cycle de vie des fournisseurs,
  la distribution des commandes et le comportement de l’AppShell de production hors de la
  couche de définition des Blocks.
- `defineAppShellComposition()` regroupe des Blocks adossés au runtime dans des emplacements logiques
  de navigation, de contenu, d’inspecteur, d’état et de superposition, sans rendu.
- `blockRenderNode()` et `renderBlockTree()` effectuent explicitement le rendu de déclarations de Blocks
  imbriquées lorsqu’un hôte ou un aperçu souhaite la sortie des Blocks enfants dans les emplacements
  du parent. Le `block.render()` ordinaire reste un contrat de rendu local d’un seul Block.
- `defineBlockSchemaAdapter()`, `defineSchemaBlock()` et
  `bindSchemaBlockInput()` valident les données inconnues reçues à la frontière avant de produire l’entrée
  de rendu du Block et les faits de liaison.
- `validateBlockMetadata()`, `blockMetadataSummary()` et les utilitaires de rapport donnent
  aux tests, à la documentation, à DOGFOOD, aux charges utiles MCP et aux agents un moyen déterministe d’inspecter
  les faits d’un Block sans effectuer le rendu d’une Surface de terminal.

Les Blocks sont décrits avant leur rendu, les auteurs de paquets évitent l’enregistrement
global caché, et l’outillage peut découvrir directement les emplacements et les modes pris en charge.
Les Blocks liés à un schéma valident les données inconnues à la frontière sans faire de Zod, de GraphQL
ou des schémas de base de données une partie de la surface de dépendances du cœur des Blocks. Les
abonnements aux fournisseurs, le parcours actif des hiérarchies, l’AppShell rendu et les captures
multimodes des Blocks de DOGFOOD restent des travaux à venir.

## Premiers candidats crédibles

### Cadre d’application

Le shell encadré est déjà l’une des structures récurrentes les plus solides de Bijou.

En tant que futur Block, `App frame` devrait standardiser :

- le rythme des volets
- le traitement de la région active
- la propriété de l’en-tête et du pied de page du shell
- les superpositions du shell comme les réglages et l’aide

### Tiroir des réglages

Le tiroir des réglages est un futur Block crédible parce qu’il dispose déjà de :

- lignes de préférences canoniques
- comportements de fermeture et de découverte gérés par le shell
- un rythme de sections stable
- un traitement fidèle de la ligne active

En tant que Block, il devrait être réutilisable sans dépendre de code propre à DOGFOOD.

### Centre de notifications

Le centre de notifications est un futur Block probable une fois les travaux Humane Terminal repris.

Il devrait à terme standardiser :

- les lignes d’avis
- la consultation de l’archive et de l’historique
- le rythme des filtres
- la distinction, gérée par le shell, entre interruption et consultation

### Parcours guidé

Le parcours guidé est la famille de Blocks générale pour :

- l’accueil des nouveaux utilisateurs
- les séquences de configuration
- les explications pas à pas
- les parcours assistés en plusieurs étapes

Il devrait composer :

- des lignes de préférences
- des alertes et des notes
- un langage d’étapes ou de chronologie
- des actions suivantes explicites

DL-005 prouve la première jointure canonique de cette famille avec `explainability()`, qui transforme la doctrine d’explicabilité de l’IA en une surface de parcours guidé structurée au lieu de la laisser à l’état de simple prose.
DL-008 promeut la jointure de Block réutilisable avec `guidedFlow()`, qui standardise une assistance en plusieurs étapes plus sereine, le rythme des sections et le traitement de l’action suivante sans obliger chaque surface guidée à se faire passer pour de l’explicabilité de l’IA.

### Panneau d’inspection

Un panneau latéral de type inspecteur est un autre candidat solide parce qu’il combine naturellement :

- des sections titrées
- un texte d’accompagnement
- la mise en valeur de la valeur courante
- un espacement compact mais serein

DL-006 prouve désormais la première jointure canonique de cette famille avec `inspector()`, qui transforme le rythme du panneau d’inspection en composant réutilisable du cœur au lieu de le laisser enfermé dans une boîte de détail DOGFOOD faite sur mesure.
DL-007 promeut la première jointure au niveau Block de cette famille avec `inspectorDrawer()`, qui standardise la composition d’inspecteurs attachés à un tiroir dans les shells TUI au lieu de laisser les tiroirs d’inspection existants assembler des chaînes à la main.

## Critères d’acceptation d’un Block

Une structure est prête à devenir un Block canonique lorsque :

- elle revient sur plus d’une surface ou d’un besoin produit
- la propriété de ses interactions est stable
- ses modèles sont déjà canoniques ailleurs
- son comportement d’abaissement est explicite
- elle améliore la réutilisation au lieu d’enfermer davantage de qualité dans un seul shell

## Ce qu’il ne faut pas faire

- ne promouvez pas chaque jolie démonstration en Block
- ne laissez pas les Blocks contourner les modèles canoniques
- ne laissez pas les Blocks devenir des hypothèses de stockage, de service ou de domaine applicatif
- ne traitez pas les Blocks comme le premier endroit où l’on pense à l’accessibilité ou à la localisation

## Relation avec le cycle actuel

DL-002 n’implémente pas de runtime de Blocks.

Ce cycle existe pour rendre la couche des Blocks explicite afin que les cycles futurs puissent promouvoir de vraies structures récurrentes de façon délibérée plutôt qu’accidentelle.
