---
title: "Invarianten"
summary: "Die unverhandelbaren Wahrheiten des Projekts und die Legenden, die sie schützen."
---
# Invarianten

Dies sind projektweite Wahrheiten, die Design und Implementierung als unverhandelbar behandeln sollten, sofern sie nicht bewusst geändert werden.

Wenn ein Designdokument oder eine Legende auf eine Invariante verweist, sollte es auf die konkrete Invariantendatei verlinken.

Jede Invariante sollte außerdem mindestens eine Legende nennen, die sie schützt.
Hat eine Invariante keine schützende Legende, hat das Repository eine Governance-Lücke.

Aktuelle Invarianten:

- [Tests sind die Spezifikation](./tests-are-the-spec.md)
- [Die Wahrheit der Laufzeit gewinnt](./runtime-truth-wins.md)
- [Schemas leben an Grenzen](./schemas-live-at-boundaries.md)
- [Host-APIs bleiben hinter Adaptern](./host-apis-stay-behind-adapters.md)
- [Codecs sind keine Domänenmodelle](./codecs-are-not-domain-models.md)
- [Der Fokus besitzt die Eingabe](./focus-owns-input.md)
- [Die oberste Ebene schließt zuerst](./topmost-layer-dismisses-first.md)
- [Sichtbare Steuerelemente sind ein Versprechen](./visible-controls-are-a-promise.md)
- [Kontrolliertes Herabstufen bewahrt die Bedeutung](./graceful-lowering-preserves-meaning.md)
- [Die Shell besitzt Shell-Belange](./shell-owns-shell-concerns.md)
- [Die Dokumentation ist die Demo](./docs-are-the-demo.md)
- [Befehle ändern den Zustand, Effekte nicht](./commands-change-state-effects-do-not.md)
- [Der Puffer enthält Fakten](./buffer-holds-facts.md)
- [Das Layout besitzt die Interaktionsgeometrie](./layout-owns-interaction-geometry.md)
- [Zustandsmaschine und View-Stack sind getrennt](./state-machine-and-view-stack-are-distinct.md)

## Schutzübersicht

| Invariante | Schützende Legende(n) |
| --- | --- |
| [Tests sind die Spezifikation](./tests-are-the-spec.md) | [WF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/WF-workflow-and-delivery.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [Die Wahrheit der Laufzeit gewinnt](./runtime-truth-wins.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Schemas leben an Grenzen](./schemas-live-at-boundaries.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Host-APIs bleiben hinter Adaptern](./host-apis-stay-behind-adapters.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
| [Codecs sind keine Domänenmodelle](./codecs-are-not-domain-models.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Der Fokus besitzt die Eingabe](./focus-owns-input.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [Die oberste Ebene schließt zuerst](./topmost-layer-dismisses-first.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
| [Sichtbare Steuerelemente sind ein Versprechen](./visible-controls-are-a-promise.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [Kontrolliertes Herabstufen bewahrt die Bedeutung](./graceful-lowering-preserves-meaning.md) | [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md), [LX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md) |
| [Die Shell besitzt Shell-Belange](./shell-owns-shell-concerns.md) | [HT](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/HT-humane-terminal.md), [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md) |
| [Die Dokumentation ist die Demo](./docs-are-the-demo.md) | [DF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md), [WF](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/WF-workflow-and-delivery.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [Befehle ändern den Zustand, Effekte nicht](./commands-change-state-effects-do-not.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md) |
| [Der Puffer enthält Fakten](./buffer-holds-facts.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DX](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DX-developer-experience.md) |
| [Das Layout besitzt die Interaktionsgeometrie](./layout-owns-interaction-geometry.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md), [DL](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md) |
| [Zustandsmaschine und View-Stack sind getrennt](./state-machine-and-view-stack-are-distinct.md) | [RE](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md) |
