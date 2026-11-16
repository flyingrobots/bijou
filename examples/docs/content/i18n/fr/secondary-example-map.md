---
title: "Carte des exemples secondaires"
summary: "Pourquoi les exemples sont désormais secondaires/internes et quelle valeur de référence ils conservent."
---
# Carte des exemples secondaires

Ce fichier n’est plus un registre géant de l’état de chaque exemple.

C’est une carte de référence destinée aux mainteneurs et aux agents, et non un
point d’entrée public de la documentation.

DOGFOOD est la principale documentation vivante et surface de mise à l’épreuve. Dans la v4.4.0,
31 exemples ont été retirés parce que DOGFOOD couvre désormais directement leurs familles
de composants. Les exemples restants servent de références pour les jointures du runtime,
de mise à l’épreuve du shell et de démonstrations d’API terminales que DOGFOOD
n’enseigne pas encore.

Si vous cherchez à apprendre Bijou, commencez par [DOGFOOD](./DOGFOOD.md),
et non par ce fichier.

Pour l’inventaire secondaire/interne complet, utilisez
[../examples/README.md](../examples/README.md).

## À conserver

Ces exemples ont encore une valeur secondaire/de référence claire.

### Références du runtime

Conservez-les comme ensemble principal de référence du runtime pour la ligne `v4.0.0` :

- `examples/v3-demo`
- `examples/v3-css`
- `examples/v3-motion`
- `examples/v3-subapp`
- `examples/v3-worker`
- `examples/v3-pipeline`

Ils gardent leurs noms historiques `v3-*`, mais restent les références les plus claires des jointures du runtime sur cette branche.

### DOGFOOD et surfaces de mise à l’épreuve du shell

Conservez-les parce qu’ils prouvent un comportement au niveau du produit plutôt qu’un rendu terminal isolé :

- `examples/docs`
  - l’application de documentation vivante et la surface de mise à l’épreuve actuelle
- `examples/release-workbench`
  - shell canonique de salle de contrôle à vues multiples
- `examples/notifications`
  - pile de notifications, routage, historique et comportement de revue du shell
- `examples/app-frame`
  - référence du shell encadré

### Exemples terminaux restants

Conservez les exemples terminaux lorsqu’ils sont l’explication isolée la plus claire
d’une famille ou d’une jointure d’API pas encore couverte par les stories de DOGFOOD. L’ensemble
restant dans ce fichier est la référence actuelle pour les retraits d’exemples qui
dépendent encore d’un enseignement plus approfondi dans DOGFOOD. Le suivi historique sur la profondeur
est [DF-020](./method/retro/DF-020-deepen-dogfood-story-depth-and-variant-quality.md).

## À retirer plus tard

Un exemple ne devient candidat au retrait que lorsque toutes les conditions suivantes sont réunies :

1. DOGFOOD ou un autre scénario canonique enseigne désormais clairement la même décision.
2. Aucun guide de migration ni README de paquet ne renvoie encore à l’exemple.
3. Il n’apporte pas de valeur unique de test de fumée ou de non-régression.
4. Il n’est pas la preuve isolée la plus claire d’une jointure d’API publique.

## Relation avec le test de fumée de publication

Le test de fumée de publication passe désormais par `smoke:dogfood`.

Clôture suivie :

- [WF-003 — Remplacer `smoke:examples:*` par `smoke:dogfood`](./design/WF-003-replace-smoke-examples-with-smoke-dogfood.md)

Les exemples ne constituent donc plus le contrat de test de fumée côté publication, même
si certains outils internes de référence autour des scénarios d’exemples
existent encore.
