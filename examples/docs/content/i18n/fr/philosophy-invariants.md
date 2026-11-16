---
title: "Invariants"
summary: "Les vérités non négociables du projet et les légendes qui les protègent."
---
# Invariants

Ce sont des vérités valables pour tout le projet, que la conception et l'implémentation doivent considérer comme non négociables, sauf modification délibérée.

Lorsqu'un document de conception ou une légende fait référence à un invariant, il doit renvoyer au fichier précis de cet invariant.

Chaque invariant doit aussi nommer au moins une légende qui le protège.
Si un invariant n'a aucune légende protectrice, le dépôt présente une lacune de gouvernance.

Invariants actuels :

- [Les tests sont la spécification](./tests-are-the-spec.md)
- [La vérité du runtime l'emporte](./runtime-truth-wins.md)
- [Les schémas vivent aux frontières](./schemas-live-at-boundaries.md)
- [Les API de l'hôte restent derrière des adaptateurs](./host-apis-stay-behind-adapters.md)
- [Les codecs ne sont pas des modèles de domaine](./codecs-are-not-domain-models.md)
- [Le focus possède l'entrée](./focus-owns-input.md)
- [Le calque le plus haut se ferme en premier](./topmost-layer-dismisses-first.md)
- [Les contrôles visibles sont une promesse](./visible-controls-are-a-promise.md)
- [La dégradation élégante préserve le sens](./graceful-lowering-preserves-meaning.md)
- [Le shell gère les préoccupations du shell](./shell-owns-shell-concerns.md)
- [Les docs sont la démo](./docs-are-the-demo.md)
- [Les commandes changent l'état, pas les effets](./commands-change-state-effects-do-not.md)
- [Le buffer contient des faits](./buffer-holds-facts.md)
- [La mise en page possède la géométrie d'interaction](./layout-owns-interaction-geometry.md)
- [La machine à états et la pile de vues sont distinctes](./state-machine-and-view-stack-are-distinct.md)

## Carte de protection

| Invariant | Légende(s) protectrice(s) |
| --- | --- |
| [Les tests sont la spécification](./tests-are-the-spec.md) | [WF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/WF-workflow-and-delivery.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [La vérité du runtime l'emporte](./runtime-truth-wins.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Les schémas vivent aux frontières](./schemas-live-at-boundaries.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Les API de l'hôte restent derrière des adaptateurs](./host-apis-stay-behind-adapters.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
| [Les codecs ne sont pas des modèles de domaine](./codecs-are-not-domain-models.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Le focus possède l'entrée](./focus-owns-input.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [Le calque le plus haut se ferme en premier](./topmost-layer-dismisses-first.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
| [Les contrôles visibles sont une promesse](./visible-controls-are-a-promise.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [La dégradation élégante préserve le sens](./graceful-lowering-preserves-meaning.md) | [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Le shell gère les préoccupations du shell](./shell-owns-shell-concerns.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md) |
| [Les docs sont la démo](./docs-are-the-demo.md) | [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [WF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/WF-workflow-and-delivery.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [Les commandes changent l'état, pas les effets](./commands-change-state-effects-do-not.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md) |
| [Le buffer contient des faits](./buffer-holds-facts.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md) |
| [La mise en page possède la géométrie d'interaction](./layout-owns-interaction-geometry.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [La machine à états et la pile de vues sont distinctes](./state-machine-and-view-stack-are-distinct.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
