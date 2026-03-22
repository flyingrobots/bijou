# `timeline()`

Chronological event view for milestone trails, release history, and audit-style sequences.

![demo](demo.gif)

## Run

```sh
npx tsx examples/timeline/main.ts
```

## Use this when

- chronology is the main structure
- the reader should follow a sequence of events or milestones
- a temporal story is more important than attribute comparison

## Choose something else when

- choose `log()` when accumulation and raw chronology matter more than milestone presentation
- choose `table()` when users are really comparing attributes across many events
- choose `dag()` when causal or dependency structure matters more than simple order

## What this example proves

- `timeline()` as a chronological status view
- milestone rows that stay readable without turning into dense data tables
- a temporal reading path that still degrades cleanly into text output

[← Examples](../README.md)
