---
title: "Guide de migration v8.0.0"
summary: "Conseils de migration pour la mise à niveau vers 8.0.0."
---
# Migrer vers Bijou 8.0.0-rc.1

Il s'agit d'une version candidate. Épinglez la version exacte ; n'utilisez pas de plage avec accent circonflexe.

```bash
npm install @flyingrobots/bijou@8.0.0-rc.1 \
            @flyingrobots/bijou-node@8.0.0-rc.1 \
            @flyingrobots/bijou-tui@8.0.0-rc.1
```

Tous les packages de l'espace de travail sont versionnés de concert ; mélanger
des packages `8.0.0-rc.1` et `7.2.0` n'est donc pas pris en charge.

Deux changements incompatibles, tous deux issus de
[`DX-052`](../../design/DX-052-no-color-is-not-a-capability.md). Aucun des deux
n'exige de modification de code pour la plupart des applications ; tous deux
changent ce que votre application *fait* dans des situations que vous n'avez
peut-être pas testées.

## 1. `NO_COLOR` ne force plus le mode `'pipe'`

### Ce qui a changé

`detectOutputMode()` n'inspecte plus `NO_COLOR`. L'ordre de détection est
désormais :

```text
BIJOU_ACCESSIBLE=1  -> 'accessible'
TERM=dumb           -> 'pipe'
!stdout.isTTY       -> 'pipe'
CI                  -> 'static'
stdout.isTTY        -> 'interactive'
```

### Pourquoi

`NO_COLOR` est une déclaration sur la couleur. [no-color.org](https://no-color.org)
précise que sa présence « empêche l'ajout de couleur ANSI » et ne dit rien de
l'adressage du curseur ni de l'interactivité. L'associer à `'pipe'` signifiait
qu'un utilisateur ayant exporté `NO_COLOR=1` dans un profil de shell — pratique
courante et raisonnable — perdait toute la TUI au lieu de sa seule couleur :
chaque composant se dégradait vers sa forme à frame unique, et
`shouldUseShellQuitConfirm()` se mettait à renvoyer `'immediate'`.

### Ce qui n'a *pas* changé

La sortie couleur. `NO_COLOR` est lu indépendamment par `createBijou()`,
`createNodeContext()` et `isNoColor()`, dont aucun ne consulte le mode. Avec
`NO_COLOR` défini, vous obtenez toujours `theme.noColor === true`, `ink()` qui
renvoie `undefined` et `styled()` qui renvoie du texte sans style.

Pour être précis sur la portée : une session interactive émet bien des
déplacements du curseur, des mises à jour de l'écran et éventuellement des
séquences d'écran alternatif — elle le doit, sinon ce n'est pas une TUI. Ce que
`NO_COLOR` supprime, ce sont **les séquences d'échappement de couleur et de
style**, ce qui est exactement ce qu'il demande.

### Ce que vous devrez peut-être faire

**Si vous comptiez sur `NO_COLOR` pour obtenir une sortie à frame unique**, par
exemple dans un script ou un harnais de capture de logs, ce n'est plus le cas.
Utilisez l'option qui correspond à la réalité :

```ts
// The terminal genuinely cannot do cursor addressing:
TERM=dumb

// You are capturing output rather than driving a terminal:
//   redirect stdout — a non-TTY stdout still yields 'pipe'

// You want to force it from inside the app:
const ctx = { ...createBijou(ports), mode: 'pipe' as const };
```

**Si vous définissiez `NO_COLOR` parce que vous vouliez une TUI monochrome**,
vous l'obtenez désormais. Aucune action nécessaire ; c'est précisément le
correctif.

**Si vous aviez écrit votre propre détecteur pour contourner ce problème** —
`git-cas` et `muniment` l'ont fait tous les deux — vous pouvez le supprimer.
Vérifiez que votre surcharge n'encode pas aussi autre chose que vous souhaitez
conserver.

## 2. Une clé de statut inconnue ne se résout plus en jeton barré

### Ce qui a changé dans le repli

`ctx.status(key)` et `ResolvedTheme.inkStatus(key)` se replient sur
`semantic.muted` au lieu de `status.muted` lorsque `key` ne figure pas dans le
thème.

### Pourquoi le repli a changé

`status.muted` porte `['dim', 'strikethrough']` dans chaque preset livré. C'est
raisonnable pour un jeton signifiant « retiré » — et faux comme réponse à « je ne
connais pas cette clé ». Comme `status(key)` accepte une `string`, une faute de
frappe, ou une clé qu'une application avait oublié d'ajouter à son thème,
produisait silencieusement un texte barré. Le lecteur voit « annulé » ;
l'application n'a rien dit de tel.

La nouvelle cible correspond à l'accesseur voisin `ui()`, qui se replie déjà sur
`semantic.primary`.

### Ce que vous devrez peut-être faire concernant le repli

**Probablement rien.** `status.muted` et `semantic.muted` partagent la même
valeur hexadécimale dans chaque preset livré ; la seule différence visible est
donc l'absence du barré.

**Si vous avez défini un thème où ces deux jetons ont des valeurs hexadécimales
différentes**, une clé inconnue se résout désormais en la valeur de
`semantic.muted`. Vérifiez tout preset personnalisé.

**Si vous comptiez sur le repli barré** pour repérer les clés non définies
pendant le développement, il a disparu. Ce n'était jamais un signal fiable — il
n'apparaissait que lorsqu'un chemin de code s'exécutait réellement.
[#521](https://github.com/flyingrobots/bijou/issues/521) suit le typage des
accesseurs afin qu'une clé manquante devienne plutôt une erreur de compilation.

`ctx.status('muted')` lui-même est inchangé, barré compris.

## 3. Ajout : `extendTheme()` atteint les six groupes de jetons

Rien d'incompatible. `border` et `semantic` rejoignent `status`, `ui`,
`gradient` et `surface` :

```ts
const theme = extendTheme(BIJOU_DARK, {
  status: { guarded: tv('#4cc9c3') },
  border: { primary: tv('#75798d') },     // now possible
  semantic: { accent: tv('#d6c5ff') },    // now possible
});
```

Les deux peuvent être surchargés mais pas étendus avec de nouvelles clés, car
`Theme` fixe leurs ensembles de clés.

### Pourquoi c'est plus important qu'il n'y paraît

Les presets livrés réutilisent beaucoup les mêmes valeurs d'un groupe à l'autre.
`bijou-dark` utilise `#f2c45d` pour `status.warning`, `status.active`,
`semantic.warning`, `semantic.accent`, `ui.cursor`, `ui.focusGutter`,
`ui.sectionHeader`, `ui.logo`, `border.secondary` **et** `border.warning` — dix
jetons, une seule couleur. `bijou-light` fait de même avec `#7a5200`.

Ainsi, `extendTheme(BIJOU_DARK, { status })` remplaçait vos statuts et
conservait silencieusement cet ambre pour chaque titre, curseur et bordure. Si
vous avez fait cela, vos titres ont probablement la même couleur que votre
`warning`. Ce n'est pas hypothétique — c'est ainsi que le problème a été
découvert, à ΔE 0,023 dans OKLab, ce qui est impossible à distinguer.

Si vous surchargez `status`, envisagez d'auditer aussi `ui` et `border` :

```ts
import { doctorTheme } from '@flyingrobots/bijou';
console.log(doctorTheme(myTheme, { maxColorReuse: 2 }));
```

Notez que `doctorTheme` vérifie le contraste et la réutilisation, mais pas la
séparation perceptive en cas de déficience de la vision des couleurs — voir
[#520](https://github.com/flyingrobots/bijou/issues/520) — et que les presets
livrés ne la satisfont pas actuellement
([#519](https://github.com/flyingrobots/bijou/issues/519)).

## Signaler vos retours sur la rc

Cette version candidate existe pour découvrir ce que ces deux changements cassent
dans de vraies applications. Merci de signaler vos retours sur
[#518](https://github.com/flyingrobots/bijou/issues/518) ou d'ouvrir un nouveau
ticket avec le label `lane:release`.
