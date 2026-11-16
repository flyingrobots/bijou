---
title: "Bijou-UX-Doktrin"
summary: "Die Produktdoktrin für ruhige, explizite, menschliche Terminal-UX."
---
# BIJOU-UX-DOKTRIN

Bijou ist eine hochwertige Terminal-UI-Engine mit einer expliziten Designhaltung zu Laufzeitwahrheit, Ehrlichkeit der Shell und menschenzentrierter Interaktion.

## Grundsätze

### 1. Der Fokus besitzt die Eingabe
Die aktive Region muss eindeutig sein und die primäre Steuerfläche besitzen. Niemand sollte sich fragen müssen, ob ein Tastendruck das aktuelle Fenster, einen verborgenen Dialog oder einen veralteten Fußzeilenhinweis betrifft.

### 2. Sichtbare Steuerelemente sind ein Versprechen
Ist ein Steuerungshinweis sichtbar, muss er für die aktive Ebene funktionieren. Inaktive oder verdeckte Steuerelemente anzupreisen, ist ein Versagen der Shell-Integrität.

### 3. Strukturelle Auswahl
Auswahl sollte durch Hintergrundfüllung, strukturelle Betonung oder Positionsglyphen vermittelt werden. Farbe kann die Auswahl verstärken, darf aber nicht das einzige Unterscheidungsmerkmal sein.

### 4. Dichte braucht Rhythmus
TUI-Dichte ist eine industrielle Stärke, kein Freibrief für visuelles Rauschen. Abstände, Ränder und ein konsistenter Rhythmus zwischen Beschriftungen und Werten müssen erhalten bleiben.

### 5. Die Shell ist ein Produkt
Der App-Rahmen – Kopfzeile, Fußzeile, Hilfe, Suche, Einstellungen und Benachrichtigungen – ist ein einheitliches, menschenzugewandtes Produkt. Er dient dazu, die Bedienerin zu orientieren, gemeinsames Verhalten zu bündeln und Unsicherheit zu verringern.

### 6. Würdevolles Absenken ist eine Pflicht
Der reichhaltige interaktive Modus ist ein Profil. Bijou bewahrt die semantische Wahrheit über die Modi `static`, `pipe` und `accessible` hinweg. Niedrigere Profile brauchen keine visuelle Gleichwertigkeit; sie erfordern semantische Ehrlichkeit.

### 7. Barrierefreiheit ist eine Eigenschaft des Fundaments
Bijou berücksichtigt Lesereihenfolge, Sehbehinderung, Farbenblindheit und kognitive Belastung auf Engine-Ebene. Eine Anwendung ist nicht schon deshalb barrierefrei, weil eine Komponente zu Text absenken kann.

### 8. Lokalisierung ist geometrisch
Die Locale beeinflusst Wortwahl, Umbruch und Leserichtung. Bijou vermeidet fest kodierte Annahmen, die Englisch oder LTR-Layouts bevorzugen.

### 9. KI-Surfaces müssen erklären
KI-vermittelte Ausgabe muss ihre Natur, ihre Belege und ihre Zuversicht offenlegen. Sie sollte die Bedienerin zur erwarteten nächsten Aktion führen.

## Interaktionsmuster

- **Tastatur zuerst, Maus als Verstärkung**: Alles Wichtige bleibt per Tastatur erreichbar. In der Praxis bleibt die Shell tastaturorientiert und mausverstärkt, und Mauseingaben ergänzen dieses wahrheitsgetreue Modell durch räumliche Interaktion.
- **Die oberste Ebene schließt zuerst**: Geschichtete TUIs müssen vorhersagbar sein. Ebenen sollten von oben geschlossen werden, und die oberste schließbare Ebene wird als erste durch `Esc` geschlossen.
- **Die oberste Ebene besitzt die sichtbaren Steuerelemente**: Die Ebene ganz oben besitzt die sichtbaren Aufforderungen, Steuerelemente und Ausstiegsmöglichkeiten, bis sie abgibt oder geschlossen wird; einfach gesagt: Was oben liegt, besitzt die sichtbaren Steuerelemente.
- **DOGFOOD ist das Testgelände**: Die Dokumentation selbst muss Shell, Suche und Barrierefreiheitshaltung wahrheitsgetreu erproben.
- **Doktrin vor Blocks**: Blocks kommen nach der Doktrin. Wiederverwendbare Blocks kommen nach der Interaktionsdoktrin, nicht davor; Richtlinien sollten Komponenten formen, nicht umgekehrt.

---
**Das Ziel ist, das Terminal von einer Sammlung von Widgets zu einem professionellen Anwendungsfundament zu machen.**
