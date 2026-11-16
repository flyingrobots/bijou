---
summary: "XLSX-Arbeitsmappen-Adapter für tabellenbasierten Lokalisierungsaustausch."
---

# @flyingrobots/bijou-i18n-tools-xlsx

XLSX-Arbeitsmappen-Adapter für Bijou-Workflows zum Lokalisierungsaustausch.

`@flyingrobots/bijou-i18n-tools-xlsx` baut auf `@flyingrobots/bijou-i18n-tools` auf und bietet:

- Serialisierung von `ExchangeWorkbook` -> XLSX-Bytes
- Parsen von XLSX-Bytes zurück in `ExchangeWorkbook`
- explizite Validierung der Kopfzeilen von Übersetzungsarbeitsmappen
- deterministische Reihenfolge der Arbeitsblätter

Dieses Paket hält Logik für Tabellenkalkulationsanbieter bewusst aus dem reinen Paket `@flyingrobots/bijou-i18n-tools` heraus.

Hinweis zur Abhängigkeit:
Seit dem 02.04.2026 wird `xlsx` aus dem offiziellen SheetJS-CDN-Tarball installiert statt aus dem Release in der npm-Registry, das veraltet ist und bekannte Sicherheitshinweise aufweist. Siehe https://docs.sheetjs.com/docs/getting-started/installation/nodejs/ für die aktuelle Installationsanleitung des Upstream-Projekts.

## Dokumentation

Im [Bijou-Repository](https://github.com/flyingrobots/bijou) findest du die vollständige Dokumentationsübersicht, den Architekturleitfaden und das Designsystem.
