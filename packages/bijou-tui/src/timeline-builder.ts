import { compileTimeline } from './timeline-compile.js';
import type {
  BuilderEntry,
  TimelineBuilder,
} from './timeline-contract.js';

export function timeline(): TimelineBuilder {
  const entries: BuilderEntry[] = [];
  const builder: TimelineBuilder = {
    add(name, definition, position) {
      entries.push({ kind: 'track', name, def: definition, position });
      return builder;
    },
    label(name) {
      entries.push({ kind: 'label', name });
      return builder;
    },
    call(name, position) {
      entries.push({ kind: 'call', name, position });
      return builder;
    },
    build() {
      return compileTimeline(entries);
    },
  };
  return builder;
}
