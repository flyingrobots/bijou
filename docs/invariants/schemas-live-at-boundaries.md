# Schemas Live At Boundaries

Schemas and parsers should reject malformed input at system edges, then
hand trusted values to runtime-backed domain forms.

Implications:

- `unknown` belongs at the edge, not deep in the core
- decoding and validation should happen before domain logic starts
- core behavior should not keep re-validating already trusted values
- plain decoded objects are not the final domain model

