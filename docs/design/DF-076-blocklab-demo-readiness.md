---
id: DF-076
title: BlockLab Demo Readiness Navigation
status: active
lane: asap
github_issue: 338
legend: DF
---

# DF-076 - BlockLab Demo Readiness Navigation

## Decision Summary

BlockLab is a focused app/workbench surface. Its story navigation keys must win
over generic framed-shell scroll bindings.

## Problem

`npm run blocklab` runs through `createFramedApp()`. The frame shell defaults to
`keyPriority: "frame-first"`, so story-navigation keys such as `up`, `down`,
`j`, and `k` are consumed by generic frame scroll bindings before BlockLab sees
them.

That makes BlockLab unusable in the release-video path and contradicts the
workbench contract: when the app advertises story navigation keys, those keys
must move the selected story.

## Scope

- Configure the BlockLab framed app to prefer page-owned keys.
- Add a regression that sends navigation keys through the framed-app runner
  path and asserts selected-story movement.

## Non-Goals

- Change the default key priority for all framed apps.
- Redesign BlockLab.
- Add Theme Lab, localization, or GraphQL demo surfaces.

## Playback

Run `npm run blocklab`, press `down` or `j`, and verify the selected story moves
from `alert()` to `badge()` without a frame key-shadowing warning.
