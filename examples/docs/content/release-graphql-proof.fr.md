# Parcours de preuve GraphQL

Fixture source : `examples/docs/fixtures/graphql/navigation-list.graphql`

Ce guide relie le récit de version au vrai fixture `NavigationListBlock` au
lieu d'un exemple synthétique.

## Chaîne de preuve

1. `GraphQL SDL` déclare le fixture de navigation DOGFOOD.
2. `bijou-block/1` enregistre l'artefact Block groupé.
3. `ui-scene-ir/1` porte les faits de scène portables.
4. `terminal Surface proof` rend le résultat DOGFOOD.
5. `graphql-bijou-block-debug/1` expose des faits de débogage déterministes.

## Ancre du fixture

Le fixture SDL versionné définit `DogfoodNavigationList`, cible
`bijou-terminal`, groupe les régions d'en-tête et d'items, lie l'élément de
navigation actif, porte les clés fallback i18n et nomme le composant
`NavigationListBlock`.
