# Invariants

These are project-wide truths that design and implementation should treat as non-negotiable unless deliberately changed.

When a design doc or legend references an invariant, it should link to the specific invariant file.

Every invariant should also name at least one legend that protects it.
If an invariant has no protecting legend, the repo has a governance gap.

Current invariants:

- [Tests Are the Spec](./tests-are-the-spec.md)
- [Runtime Truth Wins](./runtime-truth-wins.md)
- [Schemas Live At Boundaries](./schemas-live-at-boundaries.md)
- [Host APIs Stay Behind Adapters](./host-apis-stay-behind-adapters.md)
- [Codecs Are Not Domain Models](./codecs-are-not-domain-models.md)
- [Focus Owns Input](./focus-owns-input.md)
- [Topmost Layer Dismisses First](./topmost-layer-dismisses-first.md)
- [Visible Controls Are a Promise](./visible-controls-are-a-promise.md)
- [Graceful Lowering Preserves Meaning](./graceful-lowering-preserves-meaning.md)
- [Shell Owns Shell Concerns](./shell-owns-shell-concerns.md)
- [Docs Are the Demo](./docs-are-the-demo.md)
- [Commands Change State, Effects Do Not](./commands-change-state-effects-do-not.md)
- [Layout Owns Interaction Geometry](./layout-owns-interaction-geometry.md)
- [State Machine and View Stack Are Distinct](./state-machine-and-view-stack-are-distinct.md)

## Protection Map

| Invariant | Protecting legend(s) |
| --- | --- |
| [Tests Are the Spec](./tests-are-the-spec.md) | [WF](../legends/WF-workflow-and-delivery.md), [RE](../legends/RE-runtime-engine.md), [DF](../legends/DF-dogfood-field-guide.md), [DL](../legends/DL-design-language.md) |
| [Runtime Truth Wins](./runtime-truth-wins.md) | [RE](../legends/RE-runtime-engine.md), [DX](../legends/DX-developer-experience.md), [LX](../legends/LX-localization-and-bidirectionality.md) |
| [Schemas Live At Boundaries](./schemas-live-at-boundaries.md) | [RE](../legends/RE-runtime-engine.md), [DX](../legends/DX-developer-experience.md), [LX](../legends/LX-localization-and-bidirectionality.md) |
| [Host APIs Stay Behind Adapters](./host-apis-stay-behind-adapters.md) | [RE](../legends/RE-runtime-engine.md) |
| [Codecs Are Not Domain Models](./codecs-are-not-domain-models.md) | [RE](../legends/RE-runtime-engine.md), [LX](../legends/LX-localization-and-bidirectionality.md) |
| [Focus Owns Input](./focus-owns-input.md) | [HT](../legends/HT-humane-terminal.md), [RE](../legends/RE-runtime-engine.md), [DL](../legends/DL-design-language.md) |
| [Topmost Layer Dismisses First](./topmost-layer-dismisses-first.md) | [HT](../legends/HT-humane-terminal.md), [RE](../legends/RE-runtime-engine.md) |
| [Visible Controls Are a Promise](./visible-controls-are-a-promise.md) | [HT](../legends/HT-humane-terminal.md), [DF](../legends/DF-dogfood-field-guide.md), [DL](../legends/DL-design-language.md) |
| [Graceful Lowering Preserves Meaning](./graceful-lowering-preserves-meaning.md) | [DL](../legends/DL-design-language.md), [LX](../legends/LX-localization-and-bidirectionality.md) |
| [Shell Owns Shell Concerns](./shell-owns-shell-concerns.md) | [HT](../legends/HT-humane-terminal.md), [DF](../legends/DF-dogfood-field-guide.md) |
| [Docs Are the Demo](./docs-are-the-demo.md) | [DF](../legends/DF-dogfood-field-guide.md), [WF](../legends/WF-workflow-and-delivery.md), [DL](../legends/DL-design-language.md) |
| [Commands Change State, Effects Do Not](./commands-change-state-effects-do-not.md) | [RE](../legends/RE-runtime-engine.md), [DX](../legends/DX-developer-experience.md) |
| [Layout Owns Interaction Geometry](./layout-owns-interaction-geometry.md) | [RE](../legends/RE-runtime-engine.md), [DL](../legends/DL-design-language.md) |
| [State Machine and View Stack Are Distinct](./state-machine-and-view-stack-are-distinct.md) | [RE](../legends/RE-runtime-engine.md) |
