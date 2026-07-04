# GraphQL Proof Walkthrough

Source fixture: `examples/docs/fixtures/graphql/navigation-list.graphql`

This guide ties the release story to the real `NavigationListBlock` fixture
instead of a synthetic example.

## Proof Chain

1. `GraphQL SDL` declares the DOGFOOD navigation fixture.
2. `bijou-block/1` records the grouped block artifact.
3. `ui-scene-ir/1` carries the portable scene facts.
4. `terminal Surface proof` renders the DOGFOOD result.
5. `graphql-bijou-block-debug/1` exposes deterministic debug facts.

## Fixture Anchor

The checked-in SDL fixture defines `DogfoodNavigationList`, targets
`bijou-terminal`, groups header and item regions, binds the active navigation
item, carries i18n fallback keys, and names the `NavigationListBlock`
component.
