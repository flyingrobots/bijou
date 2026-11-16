---
title: "@flyingrobots/bijou-node"
summary: "Node-Adapter für Laufzeit, IO, Stil, Worker und Recorder für Bijou-Apps."
---
# @flyingrobots/bijou-node

Node.js-Adapter und Laufzeitwerkzeuge für Bijou.

`@flyingrobots/bijou-node` verbindet den reinen Kern und die TUI-Laufzeit mit der Node.js-Umgebung. Es verantwortet Plattformerkennung, Terminal-I/O, Chalk-gestütztes Styling und Hilfen für Worker-Threads.

## Rolle

- **Port-Implementierung**: Bildet Node.js-APIs auf die Bijou-Port-Schnittstellen ab.
- **Worker-Laufzeit**: Lagert schwere TEA-Logik in Worker-Threads aus und hält dabei den Hauptthread reaktionsfähig.
- **Bootstrapping**: Start einer gehosteten App mit einem Aufruf über `startApp()`.
