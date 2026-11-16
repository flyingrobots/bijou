---
title: "bijou-i18n-tools-xlsx"
summary: "Adaptadores de libros XLSX para el intercambio de localización basado en hojas de cálculo."
---

# @flyingrobots/bijou-i18n-tools-xlsx

Adaptadores de libros XLSX para los flujos de intercambio de localización de Bijou.

`@flyingrobots/bijou-i18n-tools-xlsx` se basa en `@flyingrobots/bijou-i18n-tools` y proporciona:

- serialización de `ExchangeWorkbook` -> bytes XLSX
- análisis de bytes XLSX de vuelta a `ExchangeWorkbook`
- validación explícita de los encabezados del libro de traducción
- orden determinista de las hojas del libro

Este paquete mantiene intencionadamente la lógica del proveedor de hojas de cálculo fuera del paquete puro `@flyingrobots/bijou-i18n-tools`.

Nota sobre dependencias:
Desde el 2026-04-02, `xlsx` se instala desde el tarball oficial del CDN de SheetJS en lugar de la versión del registro de npm, que está desactualizada y tiene avisos de seguridad conocidos. Consulta https://docs.sheetjs.com/docs/getting-started/installation/nodejs/ para ver la guía de instalación upstream actual.

## Documentación

Consulta el [repositorio de Bijou](https://github.com/flyingrobots/bijou) para ver el mapa completo de la documentación, la guía de arquitectura y el sistema de diseño.
