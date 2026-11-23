# Bibliothèque de composants

[English](README.md) · Français · [Español](README.es.md) · [Deutsch](README.de.md)

```sh
npm run components
```

La bibliothèque de composants est un jeu de 59 diapositives : un titre, une diapositive pour chacune des 15 sections suivie de ses composants, et une diapositive de fin. Une section regroupe des familles de composants apparentées pour faciliter la navigation ; les 42 composants couvrent 36 des 37 familles de `docs/design-system/component-families.md`. Elle montre un composant Bijou à la fois au centre de l'écran, sans rien d'autre pour détourner l'attention. Elle utilise le même catalogue de 42 stories que DOGFOOD et Block Lab, et s'exécute dans le cadre d'application standard de Bijou : la recherche, les réglages et la sortie se comportent donc comme dans DOGFOOD.

La bibliothèque s'ouvre sur un écran titre « Components Library », composé en DM Sans. Appuyez sur Enter pour commencer.

| Touche | Action |
| --- | --- |
| `h` `l`, flèches gauche et droite | Diapositive précédente ou suivante, une à la fois ; s'arrête à la première et à la dernière diapositive |
| `PgUp` `PgDn` (ou `[` `]`) | Diapositive de section précédente ou suivante ; s'arrête au titre et à la diapositive de fin |
| `Tab`, `Shift-Tab` | Faire glisser le carrousel vers la variante suivante ou précédente |
| `j` `k`, flèches haut et bas | Faire défiler lorsque le contenu est plus haut que l'écran |
| `1` `2` `3` `4` | Mode de sortie : interactive, static, pipe, accessible |
| `i` | Activer ou désactiver les informations : l'entrée de famille du composant dans le système de conception et l'exemple de la variante affichée (voir ci-dessous) |
| `r` | Activer ou désactiver la disposition de droite à gauche |
| `/` | Rechercher des noms de composants ; Enter affiche le résultat, Esc ferme |
| `F2` | Réglages, y compris le thème du shell |
| `?` | Toutes les associations de touches |
| `q`, `Esc` | Quitter, après confirmation |

Une barre sur la ligne du haut, à la place de l'en-tête du cadre, indique votre progression dans l'ensemble du jeu, avec une étiquette finale du type « 3 of 59 ». La bibliothèque dessine cette barre elle-même : elle indique une position dans une séquence, et non la progression d'une tâche ; elle n'utilise donc pas `progressBar()`. Un fil d'Ariane au-dessus du composant nomme sa section et le composant. Le `tabs()` de Bijou en dessous liste ses variantes, avec repli sur les points de `paginator()` lorsque les onglets sont plus larges que l'écran. La ligne du bas affiche les modes de sortie sous forme d'onglets, puis les interrupteurs d'informations et de droite à gauche avec leur état (`i info off · r RTL off`). Le pied de page du cadre affiche les touches de navigation.

## Ouvrir sur un écran précis

Passez des options après `--` pour ouvrir la bibliothèque sur une diapositive, un mode de sortie et un thème donnés :

```sh
npm run components -- --component alert --variant warning --mode pipe --info
npm run components -- --component table --theme book --scheme light --rtl
npm run components -- --component toast --slide family
```

| Option | Valeurs |
| --- | --- |
| `--component` | Un identifiant de story ou un nom de fonction, comme `alert` ou `table` |
| `--variant` | Un identifiant ou une étiquette de variante, comme `warning` |
| `--mode` | `interactive`, `static`, `pipe` ou `accessible` |
| `--info` | Ouvrir avec les informations affichées |
| `--rtl` | Ouvrir avec la disposition de droite à gauche |
| `--slide` | `title`, `family` (la diapositive de section), `component` ou `end` (par défaut : `component` lorsque `--component` est fourni, sinon `title`) |
| `--theme` | Une famille de thèmes du shell : `book` ou `dogfood` |
| `--scheme` | `dark` ou `light` |

Les options ou valeurs inconnues affichent le problème et l'aide d'utilisation, puis se terminent avec le code 2.

## Diapositives de section

La diapositive de chaque section affiche le mot-symbole Bijou, dans sa propre police (Jacquard 12), au-dessus du nom de la section. Il suffit d'y arriver pour qu'elle s'affiche. Elle liste les fonctions de la section, une par ligne, regroupées sous les noms de famille du système de conception, par exemple **Transient app notifications** ou **Activity stream**. Chaque diapositive de section entre et sort avec la même transition Bijou, une dissolution par cellules.

Les diapositives n'avancent jamais d'elles-mêmes. Appuyez sur Enter, Space, `l`, la flèche droite ou Tab pour passer au premier composant de la section, ou sur `h` ou la flèche gauche pour revenir en arrière. Les diapositives de titre et de fin affichent aussi le mot-symbole.

## Informations et exemples

`i` affiche l'entrée du composant dans le vocabulaire de la référence des familles de composants du système de conception (fiche R52 du livre). Elle commence par le nom de la famille et un résumé, puis un cadre intitulé **Tip for this variant** contenant le conseil de la variante affichée. En dessous, **When to use each variant** liste chaque variante avec son conseil ; cette liste reste identique quand vous changez de variante. Viennent ensuite **Use when**, **Avoid when**, **Content guidance**, **Ownership**, **Graceful lowering** et **Related families**, puis un **Example**. La story du composant fournit un champ lorsqu'elle en a un ; son entrée de famille dans `docs/design-system/component-families.md` fournit **Content guidance** et **Ownership**, et complète tout champ que la story n'a pas. `guidedFlow()` appartient à Guided flows ; son panneau inclut les champs Content guidance et Ownership de cette famille.

L'exemple est l'appel `render()` propre à la variante, lu dans son fichier de story sous `examples/docs/`. Les exemples longs sont abrégés et signalés comme tels. Certaines stories appellent un utilitaire d'aperçu partagé ; leur exemple montre alors cet utilitaire plutôt qu'un simple appel de composant.

Les composants animés s'ouvrent sur leur variante animée. Le mode interactive la joue ; le mode static affiche une seule image figée.

## Disposition de droite à gauche

`r` change le sens de lecture. La bibliothèque le transmet au cadre d'application via un runtime i18n et reflète son propre corps : le fil d'Ariane, la ligne des modes, le sens de défilement du carrousel et l'alignement du texte et des diapositives. En disposition de droite à gauche, `h`, `[` et la flèche gauche avancent vers la fin de la liste. Le code, les noms de fonctions et les composants eux-mêmes ne sont pas reflétés.

Le cadre d'application ne reflète que ce qu'il prend en charge aujourd'hui : le tiroir des réglages et les notifications s'ouvrent depuis l'autre côté. L'en-tête, le pied de page et les bordures des volets ne sont pas encore reflétés ; les tickets #571 à #575 suivent le travail restant sur le droite à gauche.

## Enregistrer une démonstration

`npm run record:components` enregistre `components.webp`, un WebP animé en couleurs complètes (non versionné ; nécessite `img2webp` via `brew install webp`) : chaque diapositive dans l'ordre du jeu, du titre à la diapositive de fin, à raison d'une pression sur `l` à la fois, sur une horloge simulée. Les diapositives de titre, de famille et de fin restent affichées plus longtemps que celles des composants. `npm run record:components -- --out=path.webp` écrit ailleurs (un chemin en `.gif` produit un GIF), et `-- --stills=1,45` écrit aussi des images fixes PNG à ces instants, en secondes.
