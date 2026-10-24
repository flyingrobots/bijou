# @flyingrobots/bijou-mcp

Der MCP-Server stellt Bijou-Komponenten als Rendering-Werkzeuge über stdio
bereit. Er ist ein Adapter für MCP-Clients und von der DOGFOOD-Vollbildanwendung
getrennt.

```sh
npm install @flyingrobots/bijou @flyingrobots/bijou-mcp
```

Den MCP-Client so konfigurieren, dass er `node` mit
`node_modules/@flyingrobots/bijou-mcp/bin/bijou-mcp.js` als Argument startet.
Zu den Werkzeugen gehören `bijou_table`, `bijou_tree`, `bijou_dag`, `bijou_box`,
`bijou_progress_bar`, Navigations- und Statuspanels sowie `bijou_docs` für den
maschinenlesbaren Komponentenleitfaden.

Jedes Werkzeug akzeptiert `output`: `text` liefert gerenderten Inhalt, `data`
liefert MCP-`structuredContent`, `both` liefert beides. Semantische Daten sind
passend, wenn ein Verbraucher Werte statt Terminalgrafik benötigt.

Der Server verwendet interaktives Komponentenlayout mit einem schlichten
Stiladapter. Das entspricht nicht dem Pipe-Lowering: `bijou_hyperlink` kann
in diesem Checkout weiterhin OSC-8-Steuersequenzen ausgeben. Issue #545 und
PR #546 verfolgen dieses Verhalten. Nicht jede Ausgabe ist frei von Escapes.

Client-Konfiguration und vollständige Werkzeugliste stehen in
`packages/bijou-mcp/README.md`. Vor der Annahme, ein offener Fix sei ausgeliefert,
die laufende Paketversion und den Tracker prüfen.
