---
title: "LX-013 — DOGFOOD Locale Preference Persistence"
legend: LX
lane: asap
---

# LX-013 — DOGFOOD Locale Preference Persistence

DOGFOOD can choose a preferred language in Settings, and startup can read the
host locale through an explicit adapter. That choice is still process-local.

Problem:

- Changing the DOGFOOD language in Settings does not survive a restart.
- Persistence would be easy to wire ad hoc from the docs app, which would bypass
  the hexagonal architecture established by LX-011.
- Tests need a deterministic fake persistence adapter rather than direct reads
  from user config paths.

Desired outcome:

- Add a preferred-locale persistence port for DOGFOOD.
- Add a Node adapter that stores the preference outside application state.
- Keep initial locale selection explicit:
  1. persisted preference when present
  2. operating-system locale through the host adapter
  3. project default locale
- Add behavior tests for missing, present, invalid, and changed preferences.

Why ASAP:

- Users reasonably expect a Settings language change to persist.
- The persistence seam should land before more settings are added.
- Keeping this behind a port prevents locale preference storage from becoming a
  hidden global or Node-only assumption.

Hill:

A DOGFOOD user can change the language, restart the app, and see the same
language selected through an explicit persistence adapter with deterministic test
coverage.

Non-goals:

- Do not add a general settings database.
- Do not couple DOGFOOD localization to a specific home-directory layout in core
  contracts.
- Do not persist translated catalog data.
