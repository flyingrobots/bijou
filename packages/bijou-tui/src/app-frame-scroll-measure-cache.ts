import type { Surface } from '@flyingrobots/bijou';
import type { OverflowX } from './focus-area.part01.js';

/** Identity of one focused-pane measurement (DL-032). */
export interface FocusedPaneMeasurementKey {
  readonly revision: number;
  readonly pageId: string;
  readonly paneId: string;
  readonly columns: number;
  readonly rows: number;
}

/** The numbers a scroll action reads from a focused-pane measurement. */
export interface FocusedPaneMeasurement {
  readonly key: FocusedPaneMeasurementKey;
  readonly paneWidth: number;
  readonly paneHeight: number;
  readonly overflowX: OverflowX;
  readonly contentWidth: number;
  readonly contentHeight: number;
}

/** One framed-app runtime's single-entry measurement cache. */
export interface FocusedPaneMeasureCache {
  /** Current frame input revision. */
  revision(): number;
  /** Increment the revision, which makes every stored entry stale. */
  invalidate(): void;
  /** Return the stored measurement only when every key field matches. */
  lookup(
    key: FocusedPaneMeasurementKey,
  ): FocusedPaneMeasurement | undefined;
  /** Replace the single entry. */
  store(measurement: FocusedPaneMeasurement): void;
  /** Measurement Surface reused across misses; owned by this runtime. */
  scratch: Surface | null;
}

export function createFocusedPaneMeasureCache(): FocusedPaneMeasureCache {
  let revision = 0;
  let entry: FocusedPaneMeasurement | undefined;
  return {
    revision: () => revision,
    invalidate() {
      revision += 1;
      entry = undefined;
    },
    lookup(key) {
      if (entry === undefined) return undefined;
      const k = entry.key;
      return k.revision === key.revision
        && k.pageId === key.pageId
        && k.paneId === key.paneId
        && k.columns === key.columns
        && k.rows === key.rows
        ? entry
        : undefined;
    },
    store(measurement) {
      entry = measurement;
    },
    scratch: null,
  };
}
