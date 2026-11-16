---
summary: "Adaptadores del sistema de archivos de Node para flujos de intercambio de localización y archivos de paquetes de catálogos."
---

# @flyingrobots/bijou-i18n-tools-node

Utilidades del sistema de archivos de Node para los flujos de intercambio de localización de Bijou.

`@flyingrobots/bijou-i18n-tools-node` se basa en `@flyingrobots/bijou-i18n-tools` y ofrece:

- lectura y escritura de archivos de hojas de intercambio CSV/TSV
- lectura y escritura de archivos CSV/TSV de tablas de cadenas fuente
- generación de archivos JSON de catálogos de runtime por locale
- carga de un único directorio de locale seleccionado con archivos JSON de catálogos de runtime
- lectura y escritura de archivos JSON de paquetes de catálogos
- lectura y escritura de directorios de libros de trabajo con un manifiesto versionado
- inferencia de formato por extensión para `.csv`, `.tsv` y `.json`
- un adaptador de carga de paquetes de catálogos de Node para `@flyingrobots/bijou-i18n`

Este paquete mantiene intencionadamente las cuestiones de Node y de archivos fuera del paquete puro `@flyingrobots/bijou-i18n-tools`.

## Cargador de runtime

`createCatalogBundleFileLoader()` convierte archivos de paquetes indexados por locale en un
cargador de runtime para `createI18nRuntimeAsync()`:

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createCatalogBundleFileLoader } from '@flyingrobots/bijou-i18n-tools-node';

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader: createCatalogBundleFileLoader({
    resolvePath: (locale) => `./i18n/${locale}.json`,
  }),
});
```

Así Bijou dispone de una vía integrada de carga de archivos en Node sin acoplar
directamente el runtime del núcleo a las API del sistema de archivos.

Para catálogos de runtime generados por locale, usa el cargador de directorios:

```ts
import { createI18nRuntimeAsync } from '@flyingrobots/bijou-i18n';
import { createRuntimeCatalogDirectoryLoader } from '@flyingrobots/bijou-i18n-tools-node';

const runtime = await createI18nRuntimeAsync({
  locale: 'fr',
  direction: 'ltr',
  loader: createRuntimeCatalogDirectoryLoader({
    rootDir: './i18n/catalogs',
  }),
});
```

El cargador lee solo `./i18n/catalogs/fr/*.json` para el locale seleccionado.
Para el comportamiento de respaldo en producción, carga `./i18n/catalogs/en/*.json` como catálogos
de respaldo explícitos mediante `createI18nRuntime({ fallbackCatalogs })` y deja que el
cargador de directorios se encargue solo del locale activo seleccionado.

## Documentación

Consulta el [repositorio de Bijou](https://github.com/flyingrobots/bijou) para ver el mapa completo de la documentación, la guía de arquitectura y el sistema de diseño.
