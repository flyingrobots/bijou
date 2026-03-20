# Pointer and Mouse Policy

Bijou is keyboard-first, not keyboard-only.

Mouse support should improve fluency without creating a second product that only works for pointer users.

## What mouse is for

Use mouse in Bijou to:

- switch visible context quickly
- dismiss or activate transient overlays
- inspect and select already-visible objects
- adjust obviously spatial controls such as split dividers

Do not use mouse as the only path to:

- submit forms
- dismiss critical errors
- navigate core app flows
- reveal essential state through hover alone

## Routing order

Pointer events should resolve from most interruptive layer to least:

1. active modal or command surface
2. transient overlays and notifications
3. shell chrome
4. page content

Background content should not keep receiving pointer actions while a true modal surface is open.

## Click policy

Clicks should usually mirror an existing keyboard action:

- clicking a tab should do what tab-switching already does
- clicking a notification action should do what pressing `enter` on the focused notification already does
- clicking dismiss should do what the dismiss shortcut already does

If there is no keyboard-parity story, the pointer behavior is probably under-designed.

## Hover policy

Hover is optional and should never be the only carrier of important meaning.

Terminals vary widely in pointer fidelity, update rate, and user expectation. Hover can be useful for polish, but it is a weak foundation for essential workflows.

## Spatial policy

Use drag only for controls that are already spatial by nature:

- split-pane dividers
- canvas or graph inspection surfaces
- future resizable inspectors or drawers

Avoid inventing drag gestures for ordinary list, table, or form interactions.

## Current library baseline

The current first-class mouse baseline in `@flyingrobots/bijou-tui` should be:

- shell tabs are clickable
- notification cards support click-to-dismiss and click-to-activate
- mouse requires explicit runtime opt-in with `run(app, { mouse: true })`

Further component adoption should follow the same rule:

- add mouse where it accelerates an existing interaction
- keep keyboard parity
- route overlays before background content
