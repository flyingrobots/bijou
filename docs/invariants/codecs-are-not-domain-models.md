# Codecs Are Not Domain Models

## Protected by legends

- [RE — Runtime Engine](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md)
- [LX — Localization and Bidirectionality](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/LX-localization-and-bidirectionality.md)

Serialization formats and decoded payload objects are not the same thing
as trusted domain values.

Implications:

- wire shapes should stay separate from runtime meaning
- encode/decode code should live in codecs, not be smeared across domain
  types
- decoded bytes or JSON should be turned into runtime-backed values
  before business logic trusts them
- a stable wire format does not excuse weak domain modeling
