---
title: "bijou-i18n-tools"
summary: "Herramientas de localización neutrales respecto al proveedor para intercambio, detección de obsolescencia y compilación de catálogos."
---

# @flyingrobots/bijou-i18n-tools

Herramientas de flujo de trabajo y autoría para la localización de Bijou.

`@flyingrobots/bijou-i18n-tools` proporciona:

- tipos de catálogo de autoría
- detección de obsolescencia por hash de origen
- filas tabulares de exportación/importación neutrales respecto al proveedor
- exportación/importación de libros aptos para hojas de cálculo
- serialización y análisis de hojas CSV/TSV
- importación/exportación CSV/TSV de tablas de cadenas de origen
- generación de catálogos de runtime por idioma a partir de tablas de cadenas
- exportación/importación de paquetes de catálogos serializables
- serialización y análisis de paquetes JSON
- puertos de adaptadores de servicio asíncronos neutrales respecto al proveedor para el intercambio de libros y paquetes
- codificación/decodificación de valores tipados para cadenas, datos y referencias
- validación y normalización de referencias
- compilación a catálogos de runtime de `@flyingrobots/bijou-i18n`
- helpers de pseudolocalización

Este paquete es intencionadamente neutral respecto al proveedor. Los adaptadores de sistema de archivos, XLSX o respaldados por servicios pueden apoyarse en él sin contaminar la API central de las herramientas.

## Flujo de trabajo con tablas de cadenas

Usa los helpers de tablas de cadenas cuando un único archivo CSV/TSV confirmado deba ser la
fuente de traducción y el runtime deba cargar un solo idioma seleccionado a la vez:

```typescript
import {
  parseStringTable,
  runtimeCatalogsForLocaleFromStringTable,
} from '@flyingrobots/bijou-i18n-tools';

const table = parseStringTable(csv, 'csv');
const catalogs = runtimeCatalogsForLocaleFromStringTable(table, 'fr');
```

Los catálogos de runtime generados incluyen solo los valores del idioma seleccionado. Las cadenas
de origen permanecen en la tabla de cadenas y en el catálogo generado del idioma de origen.
Las traducciones de otros idiomas se quedan en la tabla de origen y no viajan en la
carga del runtime.

Los flujos respaldados por servicios pueden usar los puertos de adaptadores asíncronos integrados sin
arrastrar detalles del servicio remoto al núcleo de las herramientas:

```typescript
import { pushTranslationWorkbookToService, type ExchangeWorkbookServiceAdapter } from '@flyingrobots/bijou-i18n-tools';

const adapter: ExchangeWorkbookServiceAdapter = {
  pull: async () => ({ value: existingWorkbook, revision: 'rev-1' }),
  push: async (snapshot) => snapshot,
};

await pushTranslationWorkbookToService(adapter, catalogs, 'de', {
  revision: 'rev-1',
});
```

Los clientes concretos de Google Sheets u otros servicios remotos deben vivir fuera de este
paquete e implementar el contrato del adaptador sobre las formas existentes de intercambio de libros o
paquetes.

## Documentación

Consulta el [repositorio de Bijou](https://github.com/flyingrobots/bijou) para ver el mapa completo de la documentación, la guía de arquitectura y el sistema de diseño.
