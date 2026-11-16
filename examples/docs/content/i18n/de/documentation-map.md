---
---

# Bijou-Dokumentation

| Surface | Rolle |
| :--- | :--- |
| [Projekt-README](../README.md) | Öffentliche Eingangstür |
| [Lehrbuch](https://github.com/flyingrobots/bijou-job-monitor/blob/main/book/bijou-book.pdf) | Den Job-Monitor bauen und testen |
| [Designarchiv](./book/bijou-archive.pdf) | Historische Designdokumente |
| [Gesamtausgabe](./book/bijou-designs.pdf) | Eingefrorene Lehr- und historische Sammlung |

[Lies das Lehrbuch](https://github.com/flyingrobots/bijou-job-monitor/blob/main/book/bijou-book.pdf), nutze das
[Designarchiv](./book/bijou-archive.pdf) oder
[lies das vollständige Buch](./book/bijou-designs.pdf).
Siehe [LaTeX-Quellen und Angaben zur Ausgabe](./book/README.md).

Das Lehrbuch begleitet einen Job-Monitor durch fünf Teile: warum Bijou, die
Anwendung bauen, ihre Mechanik verstehen, sie zuverlässig machen sowie sie
ausliefern und pflegen. Es enthält praktisches Referenzmaterial und den
Komponentenatlas.

Das Archiv bewahrt 426 Leitfäden, Prinzipien, Designdokumente,
Release Notes, Audits und Retrospektiven als historische Anhänge. Ihre ursprünglichen
Aussagen und ihr Status wurden nicht als aktuelle Implementierungsgarantien
umklassifiziert. Die Gesamtausgabe bewahrt die kombinierte Veröffentlichung vom
20. Oktober 2026. Das lebende Lehrbuch und seine LaTeX-Quellen gehören jetzt zum
Job-Monitor-Repository. Die einzelnen Markdown-Quelldateien bleiben entfernt;
ihr exakter Text und ihre Hashes überdauern im eingefrorenen Korpus für DOGFOOD und Prüfungen.

Für einen begrenzten Quellauszug führe vom Repository-Wurzelverzeichnis aus:

```bash
node --import tsx scripts/read-documentation.ts docs/ARCHITECTURE.md 1 80
```

Die Argumente sind der ursprüngliche Pfad, die erste Zeile und das Zeilenlimit (maximal 250).
`npm run docs:inventory` listet die beibehaltenen Betriebsdokumente und Buchartefakte auf.

Beginne mit dem Vorwort und der Versionsseite des Lehrbuchs. Jeder Lehrteil
hat eine Einführung und ein konkretes Lernziel. Die sieben Workshops nutzen das
separate [veröffentlichte Begleit-Repository](https://github.com/flyingrobots/bijou-job-monitor),
festgelegt auf Bijou 7.2.0 in der Ausgabe `book-v2`. Fünf unabhängige Baustufen, echte
Quell-Diffs und ein erläuterter Lösungsschlüssel zu den Übungen unterstützen die Workshops.
Der menschliche Durchgang ist vorbereitet; der Nutzer organisiert eine Leserin oder einen
Leser ohne Vorkenntnisse. Glossar und Themenfinder unterstützen das praktische Nachschlagen.

## Erste Schritte

- [Baue deine erste Bijou-App](./guides/getting-started.md): minimale App, Pakete, Layouts und DOGFOOD-Steuerung.
- [Job-Monitor-Tutorial](https://github.com/flyingrobots/bijou-job-monitor): eine vollständige Anwendung und das Lehrbuch.
- [Bijou entwickeln](./development.md): Toolchain, Tests, Lokalisierung und Beitrags-Workflow.

## Aktuelle Betriebsreferenzen

- [Neueste Funktionen in DOGFOOD](../examples/docs/content/guides-latest-features.md)
- [Leitfaden zum MCP-Paket](../examples/docs/content/package-mcp.md)
- [Eingangstür des Projekts](../README.md)
- [Vereinbarungen für Agenten](../AGENTS.md)
- [Designvokabular](./topics/design-vocabulary.md): kanonische Begriffe, Felder für Komponenten-Familien und Schreibstil
- [TypeScript-Code-Standards](./typescript-code-standards.editors-edition.md)
- [Code-Dojo-Ausnahmen und -Schulden](./code-dojo-exceptions.md)
- [Changelog](./CHANGELOG.md)
- [V8-Produktzeugen-Replay](./releases/8.0.0/product-witness-replay.md)
- [V8-Abnahmepaket für Stable](./releases/8.0.0/stable-acceptance.md)
- [Tutorial für gerahmte Apps](./guides/framed-app-tutorial.md)

GitHub-Issues und -Milestones verantworten den aktuellen Umfang. Historische Vorschläge
im Buch behalten ihren ursprünglichen Status. Die Linear-Migration erfordert weiterhin
ein verbundenes Team.

`npm run release:readiness -- --milestone v8.0.0` erfordert ein lebendes
Release-Paket unter `docs/releases/8.0.0/stable-acceptance.md` oder den alten Pfad
`README.md` in diesem Verzeichnis. Ein archiviertes Paket bleibt zum historischen
Lesen verfügbar, kann die aktuelle Prüfung der Release-Nachweise aber nicht erfüllen.
Der Bericht nennt das gefundene lebende Paket; sein Vorhandensein ersetzt nicht die
Prüfung seiner Nachweise.

DOGFOOD kennzeichnet seine archivgestützten Artikel als historische Referenzen. Sein
lebender Leitfaden zu den neuesten Funktionen behandelt spätere Arbeit an Schriften,
Typografie, Animation und Themes; die Paket-READMEs und ausführbaren Beispiele liefern
die detaillierten aktuellen Verträge.

Pfade von Release-Dokumenten verwenden die Release-Linie: `8.0.0-alpha.1`, `8.0.0-beta.12`,
`8.0.0-rc.1` und das stabile `8.0.0` teilen sich `docs/releases/8.0.0/`. Der
Readiness-Milestone ist `v8.0.0`; DOGFOOD nutzt dasselbe Verzeichnis für seine
Release-Leitfäden. Vorabversionen behalten ihre exakte Version im Dokumentinhalt, ohne
das Verzeichnis zu duplizieren. Bewahrte historische Dokumente bleiben über den oben
genannten begrenzten Lesebefehl zugänglich.
