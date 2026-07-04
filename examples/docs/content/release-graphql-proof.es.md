# Recorrido de prueba GraphQL

Fixture fuente: `examples/docs/fixtures/graphql/navigation-list.graphql`

Esta guía conecta la historia de release con el fixture real
`NavigationListBlock` en lugar de usar un ejemplo sintético.

## Cadena de prueba

1. `GraphQL SDL` declara el fixture de navegación DOGFOOD.
2. `bijou-block/1` registra el artefacto de bloque agrupado.
3. `ui-scene-ir/1` transporta los hechos portables de escena.
4. `terminal Surface proof` renderiza el resultado DOGFOOD.
5. `graphql-bijou-block-debug/1` expone hechos de depuración deterministas.

## Ancla del fixture

El fixture SDL registrado define `DogfoodNavigationList`, apunta a
`bijou-terminal`, agrupa regiones de encabezado e ítems, enlaza el elemento de
navegación activo, transporta claves fallback de i18n y nombra el componente
`NavigationListBlock`.
