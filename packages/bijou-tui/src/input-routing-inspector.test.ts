import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import {
  appendInputRoutingRecord,
  inputRoutingInspectorSurface,
  inputRoutingInspectorText,
  type InputRoutingInspectorHistory,
  type InputRoutingInspectorRecord,
} from './input-routing-inspector.js';

describe('input routing inspector', () => {
  it('keeps a bounded history of routing records', () => {
    let history: InputRoutingInspectorHistory = { records: [] };

    history = appendInputRoutingRecord(history, keyRecord('a', ['root']), { maxEvents: 2 });
    history = appendInputRoutingRecord(history, keyRecord('b', ['root', 'page']), { maxEvents: 2 });
    history = appendInputRoutingRecord(history, keyRecord('c', ['modal']), { maxEvents: 2 });

    expect(history.records.map((record) => record.event.kind === 'key' ? record.event.key : '')).toEqual(['b', 'c']);
  });

  it('renders key and pointer routing facts as text', () => {
    const history: InputRoutingInspectorHistory = {
      records: [
        {
          rawInput: '\\x1b[A',
          event: { kind: 'key', key: 'up' },
          commandLabels: ['select-previous'],
          result: {
            handled: true,
            commands: ['cmd'],
            effects: [],
            visitedViewIds: ['shell', 'page'],
            handledByViewId: 'page',
            handledByNodeId: 'editor',
          },
        },
        {
          event: { kind: 'pointer', action: 'press', x: 4, y: 2, button: 'left' },
          result: {
            handled: false,
            commands: [],
            effects: [],
            visitedViewIds: ['modal'],
            stoppedByViewId: 'modal',
            hit: {
              viewId: 'modal',
              point: { x: 4, y: 2 },
              path: [buttonNode()],
              target: buttonNode(),
            },
          },
        },
      ],
    };

    const text = inputRoutingInspectorText(history);

    expect(text).toContain('input routing: 2 events');
    expect(text).toContain('key up raw=\\x1b[A');
    expect(text).toContain('visited=shell>page');
    expect(text).toContain('handledBy=page');
    expect(text).toContain('node=editor');
    expect(text).toContain('commands=select-previous');
    expect(text).toContain('noop=false');
    expect(text).toContain('pointer press left 4,2');
    expect(text).toContain('stoppedBy=modal');
    expect(text).toContain('hit=button');
    expect(text).toContain('swallowed=true');
  });

  it('renders the inspector report as a surface', () => {
    const history: InputRoutingInspectorHistory = {
      records: [keyRecord('enter', ['shell'])],
    };

    const surface = inputRoutingInspectorSurface(history, { width: 40, height: 2 });
    const text = surfaceToString(surface, createTestContext().style);

    expect(text.split('\n')).toHaveLength(2);
    expect(text).toContain('input routing: 1 events');
  });
});

function keyRecord(
  key: string,
  visitedViewIds: readonly string[],
): InputRoutingInspectorRecord {
  return {
    event: { kind: 'key', key },
    result: {
      handled: false,
      commands: [],
      effects: [],
      visitedViewIds,
    },
  };
}

function buttonNode() {
  return {
    id: 'button',
    rect: { x: 3, y: 1, width: 4, height: 2 },
    children: [],
  };
}
