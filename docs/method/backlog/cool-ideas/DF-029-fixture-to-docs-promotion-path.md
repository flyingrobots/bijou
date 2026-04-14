---
title: "DF-029 — Fixture-to-Docs Promotion Path"
legend: DF
lane: cool-ideas
---

# DF-029 — Fixture-to-Docs Promotion Path

A workflow for promoting a good regression fixture into a docs/example/story asset, and promoting docs stories back into reusable test fixtures.

Why:
- Bijou increasingly has the same semantic example material spread across docs, tests, showcase, DOGFOOD, and MCP
- turning one into the other today is mostly manual and error-prone
- a shared promotion path would tighten the loop between proof, docs, and discoverability

Possible scope:
- metadata or tooling that marks fixtures as promotable stories
- one command or helper to generate docs/demo surfaces from existing fixtures
- capture provenance so docs examples can point back to tests and vice versa
- support for story matrices and MCP payload reuse later

This should reduce duplicated example maintenance across the repo.
