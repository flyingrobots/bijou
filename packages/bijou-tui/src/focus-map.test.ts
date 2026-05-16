import { surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import { describe, expect, it } from 'vitest';
import {
  focusMapSurface,
  focusMapText,
  inspectFocusMap,
} from './focus-map.js';

describe('focus map surface', () => {
  it('renders focus ownership and tab order as deterministic text', () => {
    const text = focusMapText([
      {
        id: 'editor',
        owner: 'main',
        role: 'textarea',
        rect: { x: 10, y: 2, width: 40, height: 12 },
        tabIndex: 2,
        focusable: true,
        focused: true,
      },
      {
        id: 'tree',
        owner: 'sidebar',
        role: 'list',
        rect: { x: 0, y: 2, width: 10, height: 12 },
        tabIndex: 1,
        focusable: true,
      },
    ]);

    expect(text).toContain('focus map: 2 nodes, focused=editor');
    expect(text).toContain('[1] tree owner=sidebar role=list tabIndex=1 rect=0,2 10x12 focusable=true focused=false disabled=false');
    expect(text).toContain('[2] *editor owner=main role=textarea tabIndex=2 rect=10,2 40x12 focusable=true focused=true disabled=false');
  });

  it('detects missing focus, multiple focus, disabled focus, and duplicate tabs', () => {
    const report = inspectFocusMap([
      { id: 'one', tabIndex: 1, focusable: true, focused: true, disabled: true },
      { id: 'two', tabIndex: 1, focusable: true, focused: true },
    ]);

    expect(report.issues.map((issue) => issue.kind)).toEqual([
      'multiple-focused',
      'focused-disabled',
      'duplicate-tab-index',
    ]);
    expect(report.issues[0]?.message).toBe('multiple focused nodes: one,two');

    const emptyFocus = inspectFocusMap([
      { id: 'one', focusable: true },
    ]);
    expect(emptyFocus.issues.map((issue) => issue.kind)).toEqual(['missing-focused']);
  });

  it('renders a bounded focus map surface', () => {
    const surface = focusMapSurface([
      { id: 'editor', tabIndex: 1, focusable: true, focused: true },
    ], { width: 32, height: 2 });
    const text = surfaceToString(surface, createTestContext().style);

    expect(text.split('\n')).toHaveLength(2);
    expect(text).toContain('focus map: 1 nodes');
  });
});
