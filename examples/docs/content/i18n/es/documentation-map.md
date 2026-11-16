---
---

# Documentación de Bijou

| Surface | Función |
| :--- | :--- |
| [README del proyecto](../README.md) | Puerta de entrada pública |
| [Libro didáctico](https://github.com/flyingrobots/bijou-job-monitor/blob/main/book/bijou-book.pdf) | Construir y probar el monitor de trabajos |
| [Archivo de diseño](./book/bijou-archive.pdf) | Registros de diseño históricos |
| [Edición completa](./book/bijou-designs.pdf) | Colección didáctica e histórica congelada |

[Lee el libro didáctico](https://github.com/flyingrobots/bijou-job-monitor/blob/main/book/bijou-book.pdf), usa el
[Archivo de diseño](./book/bijou-archive.pdf) o
[lee el libro completo](./book/bijou-designs.pdf).
Consulta las [fuentes LaTeX y los detalles de la edición](./book/README.md).

El libro didáctico sigue a un monitor de trabajos a lo largo de cinco Partes: por qué Bijou, la construcción
de la aplicación, la comprensión de su maquinaria, cómo hacerla fiable, y su publicación
y mantenimiento. Incluye material de referencia práctico y el atlas de componentes.

El archivo preserva 426 guías, principios, registros de diseño,
notas de versión, auditorías y retrospectivas como apéndices históricos. Sus afirmaciones
y estados originales no se han reclasificado como garantías de la implementación actual.
La edición completa preserva la publicación combinada del 20 de octubre de 2026. El libro
didáctico vivo y sus fuentes LaTeX pertenecen ahora al repositorio del monitor de trabajos.
Los archivos Markdown fuente individuales siguen eliminados;
su texto exacto y sus hashes se conservan en el corpus congelado para DOGFOOD y las comprobaciones.

Para obtener un extracto acotado de una fuente, ejecuta desde la raíz del repositorio:

```bash
node --import tsx scripts/read-documentation.ts docs/ARCHITECTURE.md 1 80
```

Los argumentos son la ruta original, la primera línea y el límite de líneas (máximo 250).
`npm run docs:inventory` lista los documentos operativos conservados y los artefactos del libro.

Empieza por el Prefacio y la página de versión del libro didáctico. Cada Parte didáctica
tiene una introducción y un resultado de aprendizaje concreto. Los siete talleres usan el
[repositorio complementario publicado](https://github.com/flyingrobots/bijou-job-monitor) independiente,
fijado a Bijou 7.2.0 en la edición `book-v2`. Cinco etapas de construcción independientes, diffs
reales del código fuente y un solucionario explicado de los ejercicios respaldan los talleres. El recorrido
con una persona real está preparado; el usuario organizará un lector que no conozca el material.
El glosario y el buscador de temas facilitan la consulta práctica.

## Primeros pasos

- [Crea tu primera aplicación Bijou](./guides/getting-started.md): aplicación mínima, paquetes, layouts y controles de DOGFOOD.
- [Tutorial del monitor de trabajos](https://github.com/flyingrobots/bijou-job-monitor): una aplicación completa y el libro didáctico.
- [Desarrollar Bijou](./development.md): cadena de herramientas, pruebas, localización y flujo de contribución.

## Referencias operativas actuales

- [Últimas funciones en DOGFOOD](../examples/docs/content/guides-latest-features.md)
- [Guía del paquete MCP](../examples/docs/content/package-mcp.md)
- [Puerta de entrada del proyecto](../README.md)
- [Acuerdos para agentes](../AGENTS.md)
- [Vocabulario de diseño](./topics/design-vocabulary.md): términos canónicos, campos de familias de componentes y estilo de redacción
- [Estándares de código TypeScript](./typescript-code-standards.editors-edition.md)
- [Excepciones y deuda de Code Dojo](./code-dojo-exceptions.md)
- [Registro de cambios](./CHANGELOG.md)
- [Reproducción del testigo de producto de V8](./releases/8.0.0/product-witness-replay.md)
- [Paquete de aceptación estable de V8](./releases/8.0.0/stable-acceptance.md)
- [Tutorial de aplicación con marco](./guides/framed-app-tutorial.md)

Los issues y milestones de GitHub definen el alcance actual. Las propuestas históricas del libro
conservan su estado original. La migración a Linear todavía requiere un equipo conectado.

`npm run release:readiness -- --milestone v8.0.0` requiere un paquete de publicación
vivo en `docs/releases/8.0.0/stable-acceptance.md` o en la ruta heredada `README.md`
de ese directorio. Un paquete archivado sigue disponible para lectura histórica,
pero no puede satisfacer la comprobación actual de evidencias de publicación. El informe indica
el paquete vivo que encontró; su presencia no sustituye la revisión de sus evidencias.

DOGFOOD marca sus artículos respaldados por el archivo como referencias históricas. Su guía viva
Latest Features cubre el trabajo posterior en fuentes, tipografía, animación y temas;
los README de los paquetes y los ejemplos ejecutables ofrecen los contratos actuales detallados.

Las rutas de los documentos de publicación usan la línea de versión: `8.0.0-alpha.1`, `8.0.0-beta.12`,
`8.0.0-rc.1` y la estable `8.0.0` comparten `docs/releases/8.0.0/`. El milestone de
preparación es `v8.0.0`; DOGFOOD usa el mismo directorio para sus guías de versión.
Las versiones preliminares conservan su versión exacta en el contenido del documento, sin duplicar
el directorio. Los documentos históricos preservados siguen accesibles mediante el
comando de lectura acotada anterior.
