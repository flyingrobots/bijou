---
title: "Invariantes"
summary: "Las verdades innegociables del proyecto y las leyendas que las protegen."
---

# Invariantes

Estas son verdades de todo el proyecto que el diseño y la implementación deben tratar como innegociables salvo que se cambien deliberadamente.

Cuando un documento de diseño o una leyenda hace referencia a un invariante, debe enlazar al archivo concreto de ese invariante.

Cada invariante también debe nombrar al menos una leyenda que lo proteja.
Si un invariante no tiene una leyenda que lo proteja, el repositorio tiene una carencia de gobernanza.

Invariantes actuales:

- [Las pruebas son la especificación](./tests-are-the-spec.md)
- [La verdad del runtime gana](./runtime-truth-wins.md)
- [Los esquemas viven en los límites](./schemas-live-at-boundaries.md)
- [Las API del host quedan detrás de adaptadores](./host-apis-stay-behind-adapters.md)
- [Los códecs no son modelos de dominio](./codecs-are-not-domain-models.md)
- [El foco es dueño de la entrada](./focus-owns-input.md)
- [La capa superior se descarta primero](./topmost-layer-dismisses-first.md)
- [Los controles visibles son una promesa](./visible-controls-are-a-promise.md)
- [La reducción elegante preserva el significado](./graceful-lowering-preserves-meaning.md)
- [El shell se ocupa de los asuntos del shell](./shell-owns-shell-concerns.md)
- [La documentación es la demo](./docs-are-the-demo.md)
- [Los comandos cambian el estado, los efectos no](./commands-change-state-effects-do-not.md)
- [El búfer contiene hechos](./buffer-holds-facts.md)
- [El layout es dueño de la geometría de interacción](./layout-owns-interaction-geometry.md)
- [La máquina de estados y la pila de vistas son distintas](./state-machine-and-view-stack-are-distinct.md)

## Mapa de protección

| Invariante | Leyenda(s) que lo protegen |
| --- | --- |
| [Las pruebas son la especificación](./tests-are-the-spec.md) | [WF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/WF-workflow-and-delivery.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [La verdad del runtime gana](./runtime-truth-wins.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Los esquemas viven en los límites](./schemas-live-at-boundaries.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Las API del host quedan detrás de adaptadores](./host-apis-stay-behind-adapters.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
| [Los códecs no son modelos de dominio](./codecs-are-not-domain-models.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [El foco es dueño de la entrada](./focus-owns-input.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [La capa superior se descarta primero](./topmost-layer-dismisses-first.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
| [Los controles visibles son una promesa](./visible-controls-are-a-promise.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [La reducción elegante preserva el significado](./graceful-lowering-preserves-meaning.md) | [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [El shell se ocupa de los asuntos del shell](./shell-owns-shell-concerns.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md) |
| [La documentación es la demo](./docs-are-the-demo.md) | [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [WF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/WF-workflow-and-delivery.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [Los comandos cambian el estado, los efectos no](./commands-change-state-effects-do-not.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md) |
| [El búfer contiene hechos](./buffer-holds-facts.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md) |
| [El layout es dueño de la geometría de interacción](./layout-owns-interaction-geometry.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [La máquina de estados y la pila de vistas son distintas](./state-machine-and-view-stack-are-distinct.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
