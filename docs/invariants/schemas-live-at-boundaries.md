# Schemas Live At Boundaries

## Protected by legends

- [RE — Runtime Engine](../legends/RE-runtime-engine.md)
- [DX — Developer Experience](../legends/DX-developer-experience.md)
- [LX — Localization and Bidirectionality](../legends/LX-localization-and-bidirectionality.md)

Schemas and parsers should reject malformed input at system edges, then
hand trusted values to runtime-backed domain forms.

Implications:

- `unknown` belongs at the edge, not deep in the core
- decoding and validation should happen before domain logic starts
- core behavior should not keep re-validating already trusted values
- plain decoded objects are not the final domain model
