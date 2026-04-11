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
signature now accepts an optional second argument
`{ columns, rows }` for dynamic sizing. Existing scenarios that
ignore this argument continue to work unchanged.
