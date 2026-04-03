# Codecs Are Not Domain Models

Serialization formats and decoded payload objects are not the same thing
as trusted domain values.

Implications:

- wire shapes should stay separate from runtime meaning
- encode/decode code should live in codecs, not be smeared across domain
  types
- decoded bytes or JSON should be turned into runtime-backed values
  before business logic trusts them
- a stable wire format does not excuse weak domain modeling

