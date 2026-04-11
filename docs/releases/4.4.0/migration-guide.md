# Migrating to Bijou 4.4.0

## No Breaking Changes

Bijou 4.4.0 is a backwards-compatible minor release. All existing
`4.3.0` code continues to work without changes.

## New Exports

The following are new exports from `@flyingrobots/bijou`:

- `sparkline(values, options?)` — returns a `string`
- `brailleChartSurface(values, options)` — returns a `Surface`
- `statsPanelSurface(entries, options)` — returns a `Surface`
- `perfOverlaySurface(stats, options?)` — returns a `Surface`

Along with their option/entry types:

- `SparklineOptions`
- `BrailleChartOptions`
- `StatsPanelEntry`
- `StatsPanelOptions`
- `PerfOverlayStats`
- `PerfOverlayOptions`

## Bench Scenario API Change (Internal)

If you have custom benchmark scenarios, the `setup()` function
signature now accepts optional `columns` and `rows` positional
arguments after `ctx`: `setup(ctx?, columns?, rows?)`. Existing
scenarios that ignore these arguments continue to work unchanged.
