---
title: "Doctrine UX de Bijou"
summary: "La doctrine produit pour une UX de terminal calme, explicite et humaine."
---
# DOCTRINE UX DE BIJOU

Bijou est un moteur d’interface de terminal haute fidélité doté d’un parti pris de conception explicite sur la vérité du runtime, l’honnêteté du shell et l’interaction centrée sur l’humain.

## Principes fondamentaux

### 1. Le focus possède la saisie
La région active doit être sans ambiguïté et détenir la surface de contrôle principale. L’utilisateur ne doit jamais se demander si une touche agit sur le volet courant, sur une fenêtre modale masquée ou sur une indication de pied de page périmée.

### 2. Les contrôles visibles sont une promesse
Si une indication de contrôle est visible, elle doit fonctionner pour la couche active. Annoncer des contrôles inactifs ou recouverts est un manquement à l’intégrité du shell.

### 3. Sélection structurelle
La sélection doit être communiquée par un remplissage d’arrière-plan, une mise en valeur structurelle ou des glyphes de position. La couleur peut renforcer la sélection, mais ne doit pas être le seul élément distinctif.

### 4. La densité exige du rythme
La densité d’une TUI est une force industrielle, pas un permis de bruit visuel. Les gouttières, les marges et un rythme cohérent entre libellés et valeurs doivent être préservés.

### 5. Le shell est un produit
Le cadre de l’application — en-tête, pied de page, aide, recherche, réglages et notifications — est un produit unifié destiné à l’humain. Il existe pour orienter l’opérateur, centraliser les comportements communs et réduire l’anxiété.

### 6. L’abaissement gracieux est une obligation
Le mode interactif riche n’est qu’un profil. Bijou préserve la vérité sémantique à travers les modes `static`, `pipe` et `accessible`. Les profils inférieurs n’ont pas besoin de parité visuelle ; ils exigent l’honnêteté sémantique.

### 7. L’accessibilité est une propriété du substrat
Bijou prend en compte l’ordre de lecture, la basse vision, le daltonisme et la charge cognitive au niveau du moteur. Une application n’est pas accessible du seul fait qu’un composant peut s’abaisser en texte.

### 8. La localisation est géométrique
La locale influe sur la formulation, le retour à la ligne et le sens de lecture. Bijou évite les hypothèses codées en dur qui privilégient l’anglais ou les mises en page LTR.

### 9. Les surfaces d’IA doivent s’expliquer
Une sortie produite par l’IA doit être explicite sur sa nature, ses éléments probants et son degré de confiance. Elle doit guider l’opérateur vers l’action suivante attendue.

## Modèles d’interaction

- **Clavier d’abord, souris en complément** : tout ce qui est important reste accessible au clavier. En pratique, le shell reste centré sur le clavier, enrichi par la souris, et la saisie à la souris enrichit ce modèle fidèle par l’interaction spatiale.
- **La couche supérieure se ferme en premier** : les TUI à couches doivent être prévisibles. Les couches se ferment depuis le haut, et la couche refermable la plus haute est la première fermée par `Esc`.
- **La couche supérieure possède les contrôles visibles** : la couche du dessus possède les invites, les contrôles et les possibilités d’échappement visibles jusqu’à ce qu’elle cède la main ou se ferme ; en clair, ce qui est au-dessus possède les contrôles visibles.
- **DOGFOOD est le terrain d’essai** : la documentation elle-même doit mettre en œuvre fidèlement le shell, la recherche et la posture d’accessibilité.
- **La doctrine avant les Blocks** : les Blocks viennent après la doctrine. Les Blocks réutilisables viennent après la doctrine d’interaction, pas avant ; la politique doit façonner les composants et non l’inverse.

---
**L’objectif est de faire passer le terminal d’une collection de widgets à un socle d’application professionnel.**
