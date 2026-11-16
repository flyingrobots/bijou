# Notes sur l'application DOGFOOD

[English](README.md) · Français · [Español](README.es.md) · [Deutsch](README.de.md)

Si vous voulez apprendre Bijou, commencez par
[../../docs/DOGFOOD.md](../../docs/book/bijou-designs.pdf#page=292). Ce fichier est la
note d'implémentation de la surface actuelle de l'application DOGFOOD.

Première tranche de DOGFOOD : une surface de documentation pilotée par des stories, construite avec Bijou lui-même.

## Exécuter

```sh
npm run dogfood
```

Pour l'atelier autonome de développement et de test BlockLab, lancez :

```sh
npm run blocklab
```

Pour un index BlockLab en texte et une matrice de captures sur le même catalogue de stories DOGFOOD, lancez :

```sh
npm run blocklab:index
```

Vous arrivez désormais d'abord sur un écran titre plein écran dédié : l'application affiche un sillage procédural de sinusoïdes empilées grâce au shader d'arrière-plan de l'écran d'accueil, en écrivant les couleurs du sillage dans les arrière-plans des cellules, tandis que les glyphes de densité utilisent des couleurs d'avant-plan assorties. Elle utilise ensuite [assets/Bijou.svg](../../assets/Bijou.svg) comme masque de glyphes à arrière-plan transparent, dans des couleurs complémentaires. L'écran d'accueil reste sobre :
l'illustration de titre V7, une invite `Press [Enter]` centrée, le
mot-symbole [assets/flyingrobotslogo.txt](../../assets/flyingrobotslogo.txt), et une
dernière ligne de pied de page réservée aux indications pour quitter ou continuer, ainsi qu'à la version de Bijou. La
marque Bijou conserve l'arrière-plan existant des cellules tout en dérivant une couleur d'avant-plan complémentaire
du sillage visible. Le mot-symbole Braille FlyingRobots laisse transparentes les cellules vides de l'asset, conserve l'arrière-plan sous-jacent des glyphes visibles, et peint ces glyphes avec la couleur opposée à cet arrière-plan conservé.

Sur l'écran d'accueil uniquement, `1-5` change de préréglage de palette et `←` / `→` parcourent les thèmes. L'apostrophe inversée (backtick) active ou désactive sur place le HUD de performance partagé du shell, `Esc` ou `q` quittent immédiatement, et toute autre touche sans modificateur ouvre le shell de documentation.

La souris est activée pour cet aperçu. Dans le shell de documentation, cliquez sur un volet pour
lui donner le focus et utilisez la molette pour faire défiler les longs documents ou l'aide.

## Ce que cela démontre

- `ComponentStory` v0 peut contenir des champs pédagogiques structurés au lieu d'un seul bloc Markdown
- une page d'accueil et un shell de documentation peuvent tous deux être pilotés par le même socle de stories
- ce même socle de stories peut aussi produire un atelier BlockLab autonome et une matrice de captures déterministe
- le shell de documentation peut porter à la fois des guides rédigés et l'explorateur de composants
- le volet de documentation et le volet d'aperçu dérivent tous deux du même enregistrement de story dès que vous entrez dans la section `Components`
- le changement de profil fait partie de l'expérience, et non d'une réflexion tardive
- un shell encadré peut présenter à la fois des sections de documentation de premier niveau et un riche navigateur de composants, sans prétendre que ce sont la même chose
- le shell de documentation choisit désormais des variantes de mise en page explicites `wide`, `standard`, `narrow` et `tiny`, de sorte que le redimensionnement du terminal reste une décision de produit et non un simple recalcul de géométrie
- DOGFOOD peut désormais publier l'orientation du dépôt, la documentation des paquets et la documentation des versions dans le même shell

## Familles de stories incluses

- retours d'information, surcouches, masquage de viewport, formulaires, navigation, visualisation de données, composition de shell, et effets de mouvement et de shader
- la story de comparaison dense présente chaque variante visuelle de `table()`,
  chaque sérialisation pipe explicite, et le chemin `navigableTableSurface()`
  piloté au clavier
- `motion-and-shader-effects` couvre désormais les vagues de shader en quadrants, les champs Braille, le raytracing adapté aux glyphes, et l'orchestration de ressorts et de chronologies dans les profils rich, static, pipe et accessible

## Touches

- `Enter` : entrer dans la documentation depuis la page d'accueil
- `Esc` / `q` : quitter depuis la page d'accueil
- `↑` / `↓` : parcourir les modes de qualité de l'écran d'accueil avant d'entrer dans la documentation
- `1` `2` `3` `4` `5` : changer les préréglages de thème de l'écran d'accueil
- `←` / `→` : parcourir les thèmes de l'écran d'accueil
- `[` / `]` : passer d'une section de documentation de premier niveau à l'autre
- `?` : ouvrir l'aide du clavier
- `/` : rechercher des stories de composants et des pages de documentation dans la surface de recherche standard du shell
- `F2` : ouvrir le tiroir de réglages standard du shell
- Backtick : activer ou désactiver le HUD de performance standard du shell
- `↑` / `↓` : parcourir les lignes du volet ayant le focus
- `Enter` / `Space` : ouvrir le guide ayant le focus, déplier une famille, sélectionner un composant ou activer la ligne ayant le focus
- `←` / `→` : replier ou déplier la famille ayant le focus dans la voie de gauche de `Components`
- `Tab` / `Shift+Tab` : déplacer le focus entre les volets
- `i` : ouvrir ou fermer le tiroir contextuel de la page ; `Esc` le ferme aussi et rend le focus au volet d’origine
- `j` / `k` : faire défiler le volet de documentation ou de démonstration ayant le focus
- `d` / `u` : paginer le volet de documentation ou de démonstration ayant le focus
- `1` `2` `3` `4` : changer de profil rich, static, pipe et accessible
- `,` / `.` : variante de story précédente ou suivante dans `Components`
- `?` : ouvrir ou fermer l'aide du clavier
- `q` / `Esc` : ouvrir la fenêtre modale standard de confirmation pour quitter

## Remarques

- Cette application est volontairement plus petite que la vitrine existante. C'est un produit de documentation vivante en cours de construction, pas encore la référence finale.
- La documentation est la démonstration : le texte des pages et l'aperçu sont générés à partir des mêmes données de story structurées.
- L'écran titre est volontairement sobre plutôt que totalement vide. Il ne conserve que l'invite d'entrée et les marques, par-dessus le traitement par shader.
- Les sections `Guides`, `Packages`, `Philosophy` et `Release` ne sont plus seulement une forme de shell. Elles publient désormais de vraies pages du corpus dans l'application, et le contrat de test de fumée orienté version passe maintenant par DOGFOOD plutôt que par l'arborescence d'exemples au sens large.
- Le shell de documentation expose déjà la recherche au niveau du shell via la palette de commandes standard du cadre, afin que les utilisateurs puissent accéder directement aux guides ou aux stories de composants correspondants, sans devoir d'abord parcourir chaque liste.
- `npm run blocklab` ouvre un atelier interactif autonome de développement et de test de composants sur le catalogue de stories.
- `npm run blocklab:index` expose le catalogue de stories sous la forme d'un poste de travail déterministe, orienté texte, pour les agents, la CI et de futurs outils MCP ou de blocs. `npm run storybook`, `npm run storybook:index` et `npm run dogfood:storybook` subsistent comme alias de compatibilité pendant la période de renommage.
- DOGFOOD utilise désormais aussi le tiroir de réglages standard géré par le shell : `F2`, la palette de commandes ou les raccourcis du cadre du shell peuvent donc basculer des préférences visibles comme les indications de touches du pied de page et la qualité de l'écran d'accueil, sans que l'application de documentation embarque sa propre plomberie de surcouche.
- La qualité de l'écran d'accueil est aussi réglable directement depuis celui-ci, afin que les utilisateurs voient l'effet avant même de quitter le traitement du titre.
- Le shell de documentation utilise des variantes de mise en page adaptatives explicites : wide garde visibles la navigation, le contenu et le contexte des métadonnées et variantes ; standard et narrow replient les volets secondaires ; tiny affiche un seul volet de contenu utile au lieu d'une surface multicolonne écrasée.
- Les lignes de réglages portent désormais de vraies descriptions secondaires, les interrupteurs s'affichent avec des repères en forme de case à cocher `☐` / `☑`, et les lignes de choix utilisent un marqueur de cycle distinct, de sorte que le tiroir se lit comme une surface de réglages de produit plutôt que comme une simple liste de texte.
- Le focus gère désormais l'entrée dans l'explorateur : la voie des familles ne traite les touches de navigation et de dépliage que lorsqu'elle est active, la voie des variantes peut gérer les changements de variante aux flèches, et les clics sur les volets ou `Tab` déplacent cette responsabilité via le shell de cadre standard, au lieu de laisser les voies inactives continuer à répondre.
- Le pied de page est désormais la surface de contrôle fidèle de l'explorateur : les indications du shell restent visibles, les indications du volet actif n'apparaissent que lorsqu'elles peuvent réellement servir, et les anciennes légendes dans les volets ne traînent plus sous les surcouches du shell ni après les changements de focus.
- Lorsqu'aucun composant n'est sélectionné, la voie centrale joue désormais le rôle de surface d'accueil : elle présente Bijou lui-même et explique comment parcourir, rechercher, configurer et naviguer dans la documentation avant que l'utilisateur n'ouvre un composant.
- L'espace de travail de l'explorateur conserve désormais une gouttière d'une cellule autour et entre les trois grandes colonnes, afin que le chrome du shell et les rails des volets ne paraissent pas tronqués aux bords du cadre.

[← DOGFOOD](../../docs/book/bijou-designs.pdf#page=292)
