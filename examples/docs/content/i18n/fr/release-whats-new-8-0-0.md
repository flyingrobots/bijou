---
title: "Nouveautés de la v8.0.0"
summary: "Le récit détaillé de la version pour la ligne 8.0.0."
---
# Nouveautés de Bijou 8.0.0-rc.1

Une version candidate, publiée pour que les changements incompatibles ci-dessous puissent être validés
sur de vraies applications avant la sortie de `8.0.0`. Épinglez la version exacte ; la
dist-tag est `next`, pas `latest`.

## L’essentiel est une suppression

`detectOutputMode()` ne tient plus compte de `NO_COLOR`.

Cette variable signifie une seule chose : ne m’envoyez pas de couleur. Elle n’a jamais signifié « ne
dessinez pas d’interface utilisateur ». Bijou la lisait comme un signal de capacité, si bien qu’un développeur
ayant `NO_COLOR=1` dans le profil de son shell n’obtenait pas une TUI monochrome — il n’obtenait aucune
TUI. Chaque composant retombait sur sa forme à image unique, et la confirmation de sortie
cessait de demander.

L’indice révélateur : deux consommateurs internes avaient chacun écrit indépendamment
leur propre détecteur pour contourner le problème. `git-cas` fournit un `detectCliTuiMode` accompagné d’un
commentaire expliquant le problème ; `muniment` a écrit le même contournement pour la même
raison. Quand les consommateurs réimplémentent votre détecteur, c’est que celui-ci répond à une
question qu’ils n’ont pas posée.

La couleur n’est pas affectée — elle n’a jamais été couplée au mode dans l’implémentation,
seulement dans le détecteur. `NO_COLOR` est lu indépendamment à trois endroits, dont aucun
ne consulte `ctx.mode` ; lorsqu’elle est définie, vous obtenez donc toujours `theme.noColor === true`
et une sortie sans style. Ce que vous obtenez en plus désormais, c’est une TUI qui fonctionne.

La forme du test mérite d’être reprise. Plutôt que d’affirmer quel mode
`NO_COLOR` produit, la propriété affirme qu’ajouter `NO_COLOR` à *n’importe quel*
environnement laisse le mode de cet environnement inchangé — le contrat énoncé
directement, sur 200 combinaisons générées de valeur, d’état TTY, de `CI` et de `TERM`.

## Une clé d’état inconnue n’a plus l’air annulée

`ctx.status('typo')` se rabattait auparavant sur `status.muted`, et `status.muted`
porte `strikethrough` dans chaque préréglage fourni. Une clé mal saisie — ou une clé qu’une
application comptait définir sans le faire — affichait donc le texte barré. Le
lecteur comprend « annulé ». L’application n’a jamais dit cela.

Elle se rabat désormais sur `semantic.muted`, qui est atténué et rien d’autre, comme
le faisait déjà l’accesseur voisin `ui()` avec `semantic.primary`.

Ce cas vient d’une vraie application qui livrait le bogue : un peintre avait été déclaré,
sa clé d’état avait ensuite été retirée du thème comme doublon, et le peintre
continuait à se résoudre sur la valeur de repli. Rien ne l’a détecté — ni le vérificateur de types, ni un
audit de palette, ni la revue — parce qu’aucune vue ne l’avait encore appelé.
[#521](https://github.com/flyingrobots/bijou/issues/521) suit le typage des
accesseurs afin que cela devienne une erreur de compilation.

## `extendTheme()` atteint enfin chaque groupe

`Theme` comporte six groupes de jetons. `extendTheme()` acceptait des extensions pour quatre d’entre eux, ce qui
ressemble à un oubli et se comporte comme un piège, car les préréglages fournis
attribuent une même couleur à plusieurs groupes, y compris ceux que vous ne pouviez pas atteindre.

`bijou-dark` peint `status.warning`, `status.active`, `semantic.warning`,
`semantic.accent`, `ui.cursor`, `ui.focusGutter`, `ui.sectionHeader`, `ui.logo`,
`border.secondary` et `border.warning` d’un seul et même ambre. Dix jetons. Ainsi
`extendTheme(BIJOU_DARK, { status })` vous donnait vos états mais laissait cet ambre
sur chaque titre, curseur et bordure — et si l’un de vos nouveaux états tirait aussi
sur l’ambre, vos titres devenaient impossibles à distinguer de vos avertissements. C’est
ainsi que le problème a été découvert, à un ΔE de 0,023 en OKLab.

`border` et `semantic` sont désormais atteignables. Ils sont surchargeables plutôt
qu’extensibles, puisque `Theme` fixe leurs ensembles de clés.

L’alias lui-même est toujours là. `extendTheme()` permet d’y échapper, sans le corriger —
voir [#519](https://github.com/flyingrobots/bijou/issues/519), qui consigne aussi
que `error` et `success` se confondent à un ΔE de 0,059 en protanopie dans le préréglage
sombre et de 0,064 dans le clair, et que l’échelle de gravité de `bijou-light` est
inversée en luminosité. Si vous comptez sur les préréglages fournis pour distinguer
les niveaux de gravité, lisez cette issue.

## Également dans cette version candidate

Tout ce qui s’est accumulé sur `main` depuis `7.2.0` :

- **Inspection en terminal des Profunctor Pages** — `lowerProfunctorPageArtifacts()`
  valide la famille canonique `profunctor-page/0` et émet de manière déterministe l’IR de scène, les surfaces,
  les cartes de cibles, les reçus, les cartes de sources de cellules et les preuves textuelles
  dans six modes d’inspection, la sémantique de navigateur non prise en charge étant conservée sous forme
  de résidus de capacité explicites.
- **Preuve de bundle d’artefacts VISOR** — `createVisorArtifactBundleFromGraphql()`,
  `createVisorArtifactBundle()` et les types `visor-artifact-bundle/1`.
- **Reçus de cellules compactées RE-036** — `adaptPackedBijouCellsToSurface()` copie
  les octets et les entrées de tables annexes validés sans réencoder les cellules.
- **Clôture de la sécurité des dépendances** — planchers corrigés dans tout le graphe résolu,
  avec un test de non-régression qui les verrouille et un `npm ci` propre reproduisant un
  audit sans aucune vulnérabilité.
- **Progression du cliquet Code Dojo** — tranches A à E, plus les prérequis
  de DX-050, la dette de localisation de DOGFOOD et le travail sur le contrat de documentation.

## À quoi sert cette version candidate

Deux changements de comportement corrects sur le principe et non éprouvés sur le terrain.
Si `NO_COLOR` ou un thème personnalisé compte pour votre application, c’est la version
à essayer avant que `8.0.0` n’existe.

Lisez le [guide de migration](./migration-guide.md) pour les points précis à vérifier,
ainsi que le [dossier de preuves de publication](./README.md) — qui indique explicitement quelles
preuves ont été rejouées pour cette version candidate et lesquelles ont été héritées, car neuf des
onze étapes de revue de la loi de publication n’ont toujours pas été examinées. C’est précisément pour cela qu’il s’agit
d’une rc et non d’une version finale.
