# GraphQL-Proof-Walkthrough

Quell-Fixture: `examples/docs/fixtures/graphql/navigation-list.graphql`

Dieser Leitfaden verbindet die Release-Geschichte mit dem echten
`NavigationListBlock`-Fixture statt mit einem synthetischen Beispiel.

## Proof-Kette

1. `GraphQL SDL` deklariert das DOGFOOD-Navigations-Fixture.
2. `bijou-block/1` zeichnet das gruppierte Block-Artefakt auf.
3. `ui-scene-ir/1` trägt die portablen Szenenfakten.
4. `terminal Surface proof` rendert das DOGFOOD-Ergebnis.
5. `graphql-bijou-block-debug/1` legt deterministische Debug-Fakten offen.

## Fixture-Anker

Das eingecheckte SDL-Fixture definiert `DogfoodNavigationList`, zielt auf
`bijou-terminal`, gruppiert Header- und Item-Regionen, bindet das aktive
Navigationselement, trägt i18n-Fallback-Keys und benennt die
`NavigationListBlock`-Komponente.
