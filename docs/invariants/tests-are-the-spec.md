# Tests Are the Spec

## Protected by legends

- [WF — Workflow and Delivery](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/WF-workflow-and-delivery.md)
- [RE — Runtime Engine](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/RE-runtime-engine.md)
- [DF — DOGFOOD Field Guide](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DF-dogfood-field-guide.md)
- [DL — Design Language](https://github.com/flyingrobots/bijou/blob/1853ad902f6bf219326409e7f743a5a1d6517dbc/docs/legends/DL-design-language.md)

If behavior matters, it must be proved in tests.

Implications:

- design docs should identify the tests to write first
- golden-path tests are not enough by themselves
- edge cases, failure cases, and stress/fuzz cases matter when warranted
- implementation does not get to quietly overrule tested behavior
