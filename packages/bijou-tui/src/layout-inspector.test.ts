import { describe, expect, it } from 'vitest';
import { createSurface, surfaceToString } from '@flyingrobots/bijou';
import { createTestContext } from '@flyingrobots/bijou/adapters/test';
import {
  layoutInspectorOverlay,
  layoutInspectorText,
} from './layout-inspector.js';

describe('layout inspector overlay', () => {
  it('draws labeled region bounds over an existing surface', () => {
    const background = createSurface(16, 5, { char: '.', empty: false });

    const overlay = layoutInspectorOverlay(background, [
      { id: 'left', role: 'pane', rect: { x: 1, y: 1, width: 6, height: 3 }, layer: 0 },
      { id: 'right', role: 'pane', rect: { x: 8, y: 1, width: 7, height: 3 }, layer: 1, focused: true },
    ]);
    const text = surfaceToString(overlay, createTestContext().style);

    expect(text).toContain('+left+');
    expect(text).toContain('+*right');
    expect(text).toContain('|....|');
  });

  it('clips off-screen regions to the background bounds', () => {
    const background = createSurface(8, 3, { char: '.', empty: false });

    const overlay = layoutInspectorOverlay(background, [
      { id: 'wide', rect: { x: -2, y: 0, width: 12, height: 4 } },
    ]);
    const text = surfaceToString(overlay, createTestContext().style);

    expect(text.split('\n')).toHaveLength(3);
    expect(text).toContain('wide');
    expect(text).toContain('|');
  });

  it('can hide labels while keeping borders', () => {
    const background = createSurface(10, 3, { char: '.', empty: false });

    const overlay = layoutInspectorOverlay(background, [
      { id: 'hidden-label', rect: { x: 1, y: 1, width: 8, height: 2 } },
    ], { showLabels: false });
    const text = surfaceToString(overlay, createTestContext().style);

    expect(text).toContain('+------+');
    expect(text).not.toContain('hidden-label');
  });

  it('renders a text report with rect, clip, scroll, focus, and layer facts', () => {
    const report = layoutInspectorText([
      {
        id: 'editor',
        role: 'pane',
        rect: { x: 2, y: 1, width: 40, height: 12 },
        clip: { x: 2, y: 2, width: 40, height: 10 },
        scroll: { x: 0, y: 12 },
        focused: true,
        layer: 3,
      },
    ]);

    expect(report).toContain('editor');
    expect(report).toContain('role=pane');
    expect(report).toContain('rect=2,1 40x12');
    expect(report).toContain('clip=2,2 40x10');
    expect(report).toContain('scroll=0,12');
    expect(report).toContain('focused=true');
    expect(report).toContain('layer=3');
  });
});
