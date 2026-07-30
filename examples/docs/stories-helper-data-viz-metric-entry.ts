export interface DataVizMetricEntry {
  readonly label: string;
  readonly value: string;
  readonly sparkline?: readonly number[];
}
