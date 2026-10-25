# @flyingrobots/bijou-mcp

El servidor MCP expone componentes Bijou como herramientas de renderizado por
stdio. Es un adaptador para clientes MCP, separado de DOGFOOD a pantalla completa.

```sh
npm install @flyingrobots/bijou @flyingrobots/bijou-mcp
```

Configura el cliente MCP para ejecutar `node` con
`node_modules/@flyingrobots/bijou-mcp/bin/bijou-mcp.js` como argumento.
Las herramientas incluyen `bijou_table`, `bijou_tree`, `bijou_dag`, `bijou_box`,
`bijou_progress_bar`, paneles de estado y navegación, y `bijou_docs` para la guía
de componentes legible por máquina.

Cada herramienta acepta `output`: `text` devuelve contenido renderizado,
`data` devuelve `structuredContent` de MCP y `both` devuelve ambos. Elige datos
semánticos cuando el consumidor necesite valores en lugar de imágenes de terminal.

El servidor usa layout interactivo con un adaptador de estilo plano.
`bijou_hyperlink` selecciona por separado su alternativa de texto sin controles
OSC 8. El valor predeterminado `fallback: "both"` devuelve `text (url)`;
`text` devuelve la etiqueta y `url` el destino. También se aplica a
`structuredContent.rendered`; los datos semánticos conservan el texto y la URL originales.

Consulta `packages/bijou-mcp/README.md` para configuración y lista completa de
herramientas. Revisa el paquete en ejecución y el tracker antes de considerar
publicada una corrección abierta.
