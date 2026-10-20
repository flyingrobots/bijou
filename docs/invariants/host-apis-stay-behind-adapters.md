# Host APIs Stay Behind Adapters

## Protected by legends

- [RE — Runtime Engine](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md)

Node, browser, worker, filesystem, terminal, and environment specifics
belong behind explicit adapter seams.

Implications:

- core packages should not reach directly for `process`, `Buffer`, or
  filesystem APIs
- host integration code should stay in adapter packages and modules
- tests should be able to swap host behavior through ports and mocks
- portability claims are stronger when the core does not know the host
