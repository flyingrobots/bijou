# Fonctionnalités récentes

Ce guide décrit le checkout de travail : version du paquet
{{RELEASE_VERSION}}, ligne {{RELEASE_LINE}}. Les fonctions sous Unreleased dans
`docs/CHANGELOG.md` peuvent être disponibles ici avant leur publication dans un
paquet. Une démo en cours d’exécution ne prouve pas une publication stable.

## Polices raster

`@flyingrobots/bijou-tui` exporte `RasterFont`, `RasterFontGlyph`,
`layoutRasterText()`, `rasterizeText()` et `rasterTextSurface()`.
Le cœur reçoit une couverture de glyphes précompilée et immuable ainsi que les
métriques d’avance. Le décodage des fichiers appartient à un adaptateur.
La démo Markdown utilise OpenType.js pour les TTF/OTF locaux et Google Fonts.
DOGFOOD charge de petits atlas hors ligne.

```typescript
import { RasterFont, RasterFontGlyph, rasterTextSurface } from '@flyingrobots/bijou-tui';

const glyph = new RasterFontGlyph({
  advance: 3, left: 0, top: 0, width: 2, height: 2, columns: 2, rows: 2,
}, new Uint8Array([0b1001]));
const font = new RasterFont({
  family: 'Fixture', lineHeight: 3, glyphs: new Map([['A', glyph]]),
});
const surface = rasterTextSurface('AAA', font, {
  columns: 30, rows: 6, renderer: { kind: 'braille' },
});
```

La sortie RGBA alimente le même pipeline Braille, blocs de quadrants ou caractères
personnalisés. Le placement gère les points de code, retours à la ligne et
approches négatives, sans shaping, bidi ni kerning. Un glyphe absent demande
un remplacement explicite. La réduction conserve les texels couverts de l’atlas
pour garder les traits fins. Des traits sous-pixel peuvent devenir plus épais
et des espaces sous-pixel peuvent se fermer.

L’API limite la longueur, la mémoire de sortie, le travail sur les glyphes et
la taille des surfaces. Voir **Packages → @flyingrobots/bijou-tui → Raster Fonts**
pour les limites complètes et le format de couverture.

## Démo de typographie Markdown

Depuis la racine du dépôt :

```sh
npm run markdown-font -- examples/markdown-font/sample.md --configure
npm run markdown-font -- document.md --font ./MyFont.otf
npm run markdown-font -- document.md --google-font "Lora"
npm run markdown-font -- document.md --offline --no-animation
npm run markdown-font -- document.md --offline --h1-size 36 --p-size 12
```

Le sélecteur interactif Google Fonts recherche dans un catalogue téléchargé.
Space Grotesk est incluse pour le mode hors ligne. Les téléchargements restent
en mémoire pendant l’exécution, sans cache persistant. Chaque requête dispose
de 15 secondes. Catalogue et police sont limités chacun à 8 MiB, CSS à 64 KiB
et documents à 1 MiB. Une famille exigeant plusieurs fichiers de sous-ensembles
ou sans source TrueType unique nécessite un TTF/OTF local. Les polices variables
utilisent leurs contours par défaut ; les polices couleur ou bitmap ne sont
pas prises en charge.

Chaque élément `h1`, `h2`, `h3`, `h4` et `p` accepte `--ELEMENT-font` et
`--ELEMENT-size`. Les valeurs comprennent une famille Google, un chemin TTF/OTF,
`google:FAMILY`, `file:PATH`, `default` ou `terminal`. La taille est une hauteur
d’encre de 4 à 256 pixels ; Braille emploie `ceil(size / 4)` lignes. Une taille
seule active la police par défaut. H1 démarre à 24 pixels ; les autres éléments
restent en texte normal tant qu’ils ne sont pas configurés. Listes, tableaux,
citations et code restent des blocs Markdown ordinaires. Les réglages concernent
cette exécution et ne modifient pas le document source.

Les couleurs parcourent le dégradé de marque du thème actif à 10 FPS. Les flèches
ou la molette font défiler ; Espace suspend ou reprend ; q ou Ctrl+C quitte.
Le redimensionnement recalcule les lignes. `--no-animation` imprime dans
l’historique du terminal. Les caractères non pris en charge, titres de plus de
256 unités UTF-16, paragraphes de plus de 20 000 unités et vues très étroites
gardent du texte. La sortie raster est limitée à 1 048 576 cellules par document.
Le contrat CLI complet est dans `examples/markdown-font/README.md`.

## Sens selon la présentation

Le moteur de police produit l’image. Le composant qui l’entoure conserve le
texte et choisit sa présentation.

| Présentation | Démo Markdown | Invite du titre DOGFOOD |
| :--- | :--- | :--- |
| Interactive | Géométrie et animation du thème | Space Grotesk et balayage coloré |
| Statique | Texte raster figé | Mots localisés |
| Pipe / accessible | Texte ; pipe peut demander `--raster` | Mots localisés |
| Glyphes absents / manque de place | Texte de repli | Texte de repli |

`NO_COLOR` supprime la couleur sans changer l’interactivité détectée. La démo
Markdown choisit aussi une sortie statique quand la couleur est désactivée.
Elle n’interprète pas `NO_COLOR` comme une absence de capacités de curseur ou
d’entrée.

## Thèmes du livre et écran de titre

DOGFOOD utilise par défaut des thèmes sombre et clair assortis au livre, avec
du corail et des neutres chauds. Les autres thèmes restent disponibles dans les
réglages. Theme Lab et Theme Inspector avec F10 exposent les tokens et diagnostics.
Ces thèmes DOGFOOD ne remplacent pas les presets globaux de la bibliothèque.

Des glyphes Jacquard 12 tournent sur un cylindre devant un bruit ASCII discret.
L’invite localisée « Press [Enter] » utilise Space Grotesk sur deux ou trois lignes
quand la place le permet. Les deux polices sont incluses avec leur licence.
L’invite utilise un atlas ASCII imprimable et revient au texte pour les autres
écritures. Vérifier la reproductibilité :

```sh
npm run check:dogfood:title
npm run check:dogfood:prompt
```

## Références actuelles et documents historiques

Le livre pédagogique appartient maintenant à `flyingrobots/bijou-job-monitor` ;
son application est figée sur Bijou 7.2.0. L’édition complète et les 426 sources
de ce dépôt restent des preuves historiques préservées. DOGFOOD marque les
articles de cette archive comme **Référence historique**. Leurs affirmations
gardent leur portée d’origine et ne suivent pas automatiquement ce checkout.

Pour le comportement récent, utiliser ce guide, les README actuels, les exemples
exécutables et le changelog. **Récit de version actuel** suit la version en cours
dans les quatre langues prises en charge. **Packages → @flyingrobots/bijou-mcp**
décrit l’adaptateur MCP, ses sorties structurées et la limite des hyperliens.
Les issues et jalons GitHub restent l’autorité pour le travail de version inachevé.
