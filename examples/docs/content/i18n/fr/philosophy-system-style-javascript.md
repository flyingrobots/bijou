---
title: "JavaScript de style système"
summary: "Vérité du runtime, frontières, adaptateurs, codecs et doctrine d’infrastructure à l’échelle du dépôt."
---
# JavaScript de style système

_Comment écrire une infrastructure JavaScript qui dure._

Ceci est une doctrine d’ingénierie à l’échelle du dépôt pour Bijou et les autres
bases de code `flyingrobots`. Ce n’est pas un guide de style de formatage. C’est une
doctrine pour écrire une infrastructure qui reste honnête face à l’exécution,
au rejeu, à la migration, au débogage, à la réplication, aux pannes et au temps.

## Adaptation à Bijou

Bijou est actuellement implémenté en grande partie en TypeScript. Cela n’affaiblit
pas cette doctrine. Cela précise la manière dont TypeScript doit être utilisé ici.

Dans ce dépôt :

- TypeScript est un dialecte utile, pas l’autorité finale
- la modélisation adossée au runtime l’emporte sur la confiance fondée sur les seuls types
- l’analyse aux frontières, les adaptateurs explicites et les tests l’emportent sur le confort de l’éditeur
- les affirmations fortes sur l’architecture doivent s’ancrer dans le code d’exécution,
  les invariants et une preuve exécutable

Cette doctrine ne signifie donc **pas** « réécrire Bijou en `.js` pur
dès demain ». Elle signifie que Bijou doit considérer la vérité du runtime comme
l’autorité architecturale, même lorsque le langage d’implémentation est
TypeScript.

## Règle 0 : la vérité du runtime l’emporte

Lorsque le programme s’exécute, une question prime sur toutes les autres :

**Qu’est-ce qui est réellement vrai à cet instant, en mémoire, pendant l’exécution ?**

Si la réponse dépend de commentaires, de conventions, de types disparus, de vœux
pieux ou de l’intuition de l’éditeur, le code ment.

Les valeurs de domaine de confiance doivent être créées par une construction à l’exécution,
une analyse ou une validation qui établit leurs invariants. Une fois
établis, ces invariants doivent être préservés tant que la valeur
reste de confiance.

Cette règle l’emporte sur la documentation, les étapes de build, les indications de l’éditeur, les
surcouches statiques, l’outillage à la compilation, le folklore de l’équipe et le « mais le linter disait
que c’était bon ».

## Ce que cela signifie en pratique

L’infrastructure ne peut pas se permettre de faux contrats :

- un type qui disparaît à l’exécution n’est pas un contrat faisant autorité
- un commentaire décrivant une forme n’est pas un contrat faisant autorité
- un objet simple qui « devrait » avoir des champs valides n’est pas un contrat
  faisant autorité
- une infobulle de l’IDE n’est pas un contrat faisant autorité
- une étape de compilation n’est pas un contrat faisant autorité

Ces outils peuvent être utiles. Aucun d’eux ne l’emporte sur le runtime.

## Pourquoi c’est important ici

Bijou n’est pas une simple colle de vues. Le dépôt touche :

- l’état d’exécution et le flux d’événements
- les frontières avec l’hôte et les adaptateurs
- les tests déterministes et la rejouabilité
- les catalogues de localisation et les formats d’échange
- des API publiques durables
- un comportement du shell qui doit rester explicable aussi bien aux humains qu’aux
  agents

Ici, les hypothèses floues se transforment en bogues à longue demi-vie.

## La hiérarchie de la vérité

Lorsque les couches divergent, l’autorité suit cet ordre :

1. **Modèle de domaine à l’exécution** : constructeurs, invariants, méthodes, types
   d’erreur
2. **Schémas et analyseurs aux frontières** : Zod, décodeurs, validateurs de protocole
3. **Tests** : la spécification exécutable
4. **JSDoc et documents de conception** : explications destinées aux humains du modèle
   d’exécution
5. **IDE et outillage statique** : navigation, aide à la refactorisation
6. **TypeScript** : dialecte utile, pas l’autorité finale

## Portée

Cette norme est optimisée pour :

- le code d’infrastructure aux invariants forts
- les systèmes durables aux frontières explicites
- les flux d’exécution directe portables d’un hôte à l’autre
- les cœurs capables de tourner dans un navigateur
- les dépôts JavaScript d’abord ou utilisant TypeScript comme dialecte
- le code qui doit pouvoir être enseigné, lu et publié

Ce n’est pas une affirmation selon laquelle tout projet JavaScript devrait ressembler à cela.
C’est **bien** une affirmation selon laquelle, pour cette famille de dépôts, la modélisation du domaine
adossée au runtime l’emporte sur une confiance molle dans les formes.

## Politique linguistique

### JavaScript d’abord, TypeScript subordonné

JavaScript reste le langage de base conceptuel de cette doctrine :

- rapide à écrire et à modifier
- directement exécutable
- portable
- assez expressif pour une infrastructure sérieuse
- assez lisible pour servir à l’enseignement

Bijou utilise actuellement beaucoup TypeScript, mais la règle est la même :
TypeScript peut améliorer la refactorisation, le support de l’éditeur et l’ergonomie
pour les consommateurs. Il ne remplace **pas** la validation à l’exécution, ne préserve pas
les invariants à lui seul et n’excuse pas une modélisation faible.

Utilisez TypeScript là où il aide. Ne le confondez jamais avec la source de
vérité.

### Échappatoire : Rust via WebAssembly

Lorsque JavaScript ne suffit pas pour un travail CPU intensif, l’analyse de binaires hostiles,
des noyaux cryptographiques ou des boucles critiques sensibles à la mémoire, utilisez Rust.

Répartition préférée :

| Couche | Langage | Rôle |
|------|------|------|
| Logique de domaine centrale | JavaScript / TypeScript avec modélisation adossée au runtime | Par défaut, portable, compatible navigateur |
| Noyaux critiques pour les performances | Rust -> Wasm | Sûreté et vitesse là où c’est justifié |
| Adaptateurs d’hôte | JavaScript / TypeScript | Frontières Node, navigateur, worker |
| Orchestration | JavaScript / TypeScript | Colle entre les cœurs et les hôtes |

## Architecture

### Portabilité, le navigateur d’abord

Le navigateur est la plateforme de déploiement la plus universelle et le test ultime
de portabilité. La logique centrale doit privilégier des primitives compatibles avec
la plateforme web.

```javascript
// Portable
const bytes = new TextEncoder().encode(text);
const arr = new Uint8Array(buffer);
const url = new URL(path, base);

// Node-only; belongs in adapters
const buf = Buffer.from(text, 'utf8');
const resolved = require('path').resolve(p);
```

### L’architecture hexagonale est obligatoire

La logique de domaine centrale ne doit pas dépendre directement des globales Node, des API du
système de fichiers, de `process`, de `Buffer` ni d’appels propres à l’hôte. Ceux-ci se placent derrière
des ports d’adaptateurs.

**Règle centrale :** la logique centrale ne doit pas savoir que Node existe.

Dans les termes de Bijou :

- `@flyingrobots/bijou` définit les ports et les utilitaires purs
- `@flyingrobots/bijou-node` possède l’intégration Node
- les jointures du runtime, de l’i18n et de l’outillage doivent rester explicites plutôt que
  de laisser fuir des hypothèses sur l’hôte vers l’intérieur

## Modèle objet

Le JavaScript de style système organise le code autour d’objets adossés au runtime :

- des **objets valeur** pour les valeurs significatives dotées d’invariants
- des **entités** pour l’identité et le cycle de vie
- des **résultats / issues** sous forme d’objets répartissables à l’exécution, et non de sacs
  étiquetés mous
- des **erreurs** en tant qu’échecs de domaine de première classe, et non d’analyse de messages
  typés par chaînes

Les classes sont souvent un bon outil ici, mais la vraie règle est plus forte que
« utilisez des classes » : les concepts importants ont besoin de formes adossées au runtime aux
invariants préservés.

## Principes

### P1 : les concepts de domaine exigent des formes adossées au runtime

Si un concept a des invariants, une identité ou un comportement, il lui faut une
représentation adossée au runtime. Un typedef ou un objet simple ne suffit pas.

### P2 : la validation a lieu aux frontières et aux points de construction

Une entrée non fiable ne devient une donnée de confiance que par des constructeurs ou
des méthodes d’analyse dédiées. Les constructeurs établissent les invariants et n’effectuent
pas d’E/S.

### P3 : le comportement appartient au type qui le possède

Évitez les branchements sur des étiquettes `kind` ou `type` lorsque la répartition à l’exécution suffit.
Placez le comportement sur le type propriétaire.

### P4 : les schémas ont leur place aux frontières, pas dans le cœur

Utilisez les schémas pour rejeter les entrées mal formées en périphérie. Les types de domaine possèdent
le comportement et les invariants à l’intérieur de la frontière.

### P5 : la sérialisation est l’affaire du codec

La couche des octets reste séparée de la couche du sens. Les types de domaine
n’ont pas besoin de savoir comment ils sont encodés.

### P6 : source unique de vérité

Ne dupliquez pas le même contrat entre JSDoc, TypeScript et les
validateurs. Définissez d’abord le modèle d’exécution. Tout le reste en dérive
ou le documente.

### P7 : répartition à l’exécution plutôt que branchement sur étiquettes

Au sein d’un runtime cohérent, `instanceof` est souvent correct. Lorsque des valeurs
traversent des realms ou des frontières de modules dupliqués, utilisez le marquage plutôt que de
prétendre que l’identité nominale tient encore.

## Pratiques

- **`any` est banni ; `unknown` est mis en quarantaine** : `unknown` n’est autorisé
  qu’aux bords bruts et doit être éliminé immédiatement par l’analyse
- **les valeurs de confiance doivent préserver leur intégrité** : utilisez `Object.freeze()`,
  un état privé ou des copies défensives si nécessaire
- **le type d’erreur est primordial ; les codes sont des métadonnées facultatives** : ne faites jamais
  de branchement sur `err.message`
- **les objets de paramètres doivent apporter une valeur sémantique** : n’érigez pas une bouillie
  d’options en norme de conception d’API publique
- **les objets bruts peuvent transporter des octets, pas du sens** : les objets simples servent aux
  charges utiles décodées ou à la journalisation, pas à la sémantique de domaine de confiance
- **les nombres et chaînes magiques sont bannis** : donnez de vrais noms aux constantes
  sémantiques
- **les paramètres booléens pièges sont bannis** : préférez des politiques nommées ou
  des méthodes distinctes
- **les données structurées restent structurées** : n’obligez pas les machines à analyser de la prose
  pour retrouver des données
- **la portée du module est la première frontière de confidentialité** : ce qui n’est pas exporté
  est privé
- **JSDoc documente le modèle d’exécution ; il ne le remplace pas**

## Discipline d’outillage

**Le lint fait loi.**

- les erreurs de lint font échouer la CI
- les suppressions exigent une raison documentée
- l’application la plus stricte doit porter sur les coercitions dangereuses, les promesses
  flottantes, l’usage brut de `Error` et les fuites propres à l’hôte dans le code du cœur

Lorsque TypeScript est utilisé :

- il reste subordonné à la validation à l’exécution
- il ne doit pas se substituer à la modélisation du domaine
- `any` est interdit
- `unknown` n’a sa place qu’aux bords bruts et doit disparaître rapidement

## La doctrine anti-soupe de formes

La plupart des mauvaises infrastructures viennent d’une modélisation faible. La discipline est la suivante :

1. nommer le concept
2. construire le concept avec des invariants validés
3. protéger l’invariant
4. attacher le comportement au type propriétaire
5. garder la frontière avec des schémas et des analyseurs
6. séparer le codec du domaine
7. isoler l’hôte derrière des adaptateurs
8. documenter le runtime qui existe réellement
9. tester la vérité

## Liste de vérification de revue

Avant de fusionner, demandez-vous :

- s’agit-il d’un vrai concept de domaine, et où se trouve sa forme adossée au runtime ?
- où `unknown` est-il éliminé ?
- la construction établit-elle la confiance ?
- le comportement réside-t-il sur le type qui le possède ?
- quelqu’un analyse-t-il `err.message` comme un raton laveur dans une poubelle ?
- y a-t-il des nombres ou des chaînes magiques ?
- cette logique pourrait-elle s’exécuter dans un cœur compatible navigateur ?
- une fiction d’outillage est-elle prise pour de l’architecture ?

## Invariants dérivés

Cette doctrine se reflète dans les invariants suivants du dépôt :

- [La vérité du runtime l’emporte](./invariants/runtime-truth-wins.md)
- [Les schémas vivent aux frontières](./invariants/schemas-live-at-boundaries.md)
- [Les API de l’hôte restent derrière des adaptateurs](./invariants/host-apis-stay-behind-adapters.md)
- [Les codecs ne sont pas des modèles de domaine](./invariants/codecs-are-not-domain-models.md)
- [Les tests sont la spécification](./invariants/tests-are-the-spec.md)

Ceci est de l’infrastructure. Le code ne peut pas compter sur des déguisements ni prétendre que
les commentaires sont des contrats. La vérité du runtime l’emporte à chaque fois sur une certitude fantôme.
