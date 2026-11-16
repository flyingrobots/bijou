---
title: "@flyingrobots/bijou-tui-app"
summary: "Le point de départ de shell encadré, aux choix assumés, pour les applications Bijou plein écran à onglets."
---
# `@flyingrobots/bijou-tui-app`

Squelette d'application TUI tout compris, construit sur `createFramedApp()`.

## Rôle du package

- **Contrat de shell pur** — les volets encadrés restent désormais sur le chemin surface/mise en page. Les volets du shell rendent une `Surface` ou un `LayoutNode`, pas des vues sous forme de chaînes.
- **Rôle de shell fidèle** — ce package est la couche de shell aux choix assumés de la pile Bijou, pas le runtime tout entier. Utilisez-le lorsque vous voulez des onglets, un habillage de pied de page et d'aide, des superpositions et un cadre d'application prêt à l'emploi.
- **Point de départ canonique de la version** — le générateur de projet et les références actuelles du runtime considèrent ce package comme la manière par défaut de mettre en place une application Bijou plein écran soignée.

Il fournit un shell prêt à l'emploi avec des valeurs par défaut raisonnables :
- shell d'application encadré plein écran
- barre d'onglets en haut (séparateurs `|`, arrière-plans des onglets actif/inactif)
- tiroir complémentaire animé sur le premier onglet (`o` pour basculer)
- changement de page via `[` et `]`
- modale de confirmation de sortie sur `q` et `ctrl+c`
- pied de page sur deux lignes : ligne d'état au-dessus de la ligne des contrôles
- ligne de séparation `\` pleine largeur au-dessus du pied de page
- deux onglets par défaut :
  - onglet 1 : volet principal + tiroir complémentaire
  - onglet 2 : partage horizontal pour les parcours de comparaison et d'inspection

## Quand l'utiliser

Utilisez `@flyingrobots/bijou-tui-app` lorsque :
- votre application a des destinations de même niveau qui ont leur place dans des onglets
- vous voulez un habillage de shell, une aide, un état et une découverte des commandes standardisés
- le travail annexe doit vivre dans un tiroir au lieu d'accaparer tout l'écran
- les sorties destructives ou les parcours de revue doivent être gérés par une modale

Évitez-le lorsque :
- vous construisez une CLI ponctuelle ou un parcours d'invite
- l'interface est essentiellement un seul document et n'a pas besoin d'habillage de shell
- vous voulez un shell entièrement personnalisé au lieu d'adopter le point de départ aux choix assumés de Bijou

## Rôle dans le design system

Ce point de départ fait délibérément des choix assumés :
- les onglets servent aux destinations de même niveau
- le tiroir sert au travail annexe complémentaire, aux filtres, à l'inspection et au contexte
- la modale de sortie sert aux confirmations bloquantes
- les lignes du pied de page sont de l'habillage de shell, pas du contenu de page
- la page partagée illustre une mise en page de comparaison et de contexte secondaire, pas un remplissage générique
