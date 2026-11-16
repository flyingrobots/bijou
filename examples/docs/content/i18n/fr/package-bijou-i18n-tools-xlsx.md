---
summary: "Adaptateurs de classeurs XLSX pour l'échange de localisation piloté par feuilles de calcul."
---
# @flyingrobots/bijou-i18n-tools-xlsx

Adaptateurs de classeurs XLSX pour les flux d'échange de localisation de Bijou.

`@flyingrobots/bijou-i18n-tools-xlsx` s'appuie sur `@flyingrobots/bijou-i18n-tools` et fournit :

- la sérialisation `ExchangeWorkbook` -> octets XLSX
- l'analyse des octets XLSX vers `ExchangeWorkbook`
- la validation explicite des en-têtes des classeurs de traduction
- un ordre déterministe des feuilles du classeur

Ce package tient volontairement la logique propre aux fournisseurs de feuilles de calcul à l'écart du package pur `@flyingrobots/bijou-i18n-tools`.

Note sur les dépendances :
Depuis le 2026-04-02, `xlsx` est installé depuis l'archive tarball officielle du CDN SheetJS plutôt que depuis la version du registre npm, qui est obsolète et fait l'objet d'avis de sécurité connus. Voir https://docs.sheetjs.com/docs/getting-started/installation/nodejs/ pour les instructions d'installation amont actuelles.

## Documentation

Consultez le [dépôt Bijou](https://github.com/flyingrobots/bijou) pour la carte complète de la documentation, le guide d'architecture et le design system.
