import { describe, expect, it } from 'vitest';
import { createSurface, type Surface } from '@flyingrobots/bijou';
import { compositeSurface, compositeSurfaceInto } from './overlay.js';
import { isDimmedBackdropCell } from './overlay-backdrop.js';

function filled(width: number, height: number, char: string): Surface {
  const surface = createSurface(width, height);
  surface.fill({ char, fg: '#ffffff', bg: '#000000' });
  return surface;
}

const dialog = { content: '', surface: filled(4, 2, 'd'), row: 1, col: 2 };

describe('dimmed backdrop record', () => {
  it('marks dimmed cells outside every overlay as backdrop, and the overlay cells as not', () => {
    const out = compositeSurface(filled(10, 4, 'w'), [dialog], { dim: true });
    expect(isDimmedBackdropCell(out, 0, 0)).toBe(true);
    expect(isDimmedBackdropCell(out, 9, 3)).toBe(true);
    for (let y = 1; y < 3; y++) for (let x = 2; x < 6; x++) expect(isDimmedBackdropCell(out, x, y)).toBe(false);
  });

  it('records nothing when the background is not dimmed', () => {
    const out = compositeSurface(filled(10, 4, 'w'), [dialog]);
    expect(isDimmedBackdropCell(out, 0, 0)).toBe(false);
  });

  it('does not mark blank backdrop cells, which the compositor leaves undimmed', () => {
    const out = compositeSurface(filled(10, 4, ' '), [dialog], { dim: true });
    expect(isDimmedBackdropCell(out, 0, 0)).toBe(false);
  });

  it('forgets the backdrop when a reused target is composited again without dimming', () => {
    const target = createSurface(10, 4);
    compositeSurfaceInto(filled(10, 4, 'w'), target, [dialog], { dim: true });
    expect(isDimmedBackdropCell(target, 0, 0)).toBe(true);
    compositeSurfaceInto(filled(10, 4, 'w'), target, [dialog]);
    expect(isDimmedBackdropCell(target, 0, 0)).toBe(false);
  });

  it('stops treating a backdrop cell as backdrop once something undimmed is drawn over it', () => {
    const out = compositeSurface(filled(10, 4, 'w'), [dialog], { dim: true });
    out.set(0, 0, { char: 'x', fg: '#ffffff', bg: '#000000' });
    expect(isDimmedBackdropCell(out, 0, 0)).toBe(false);
  });

  it('treats coordinates outside the surface and unrecorded surfaces as not backdrop', () => {
    const out = compositeSurface(filled(10, 4, 'w'), [dialog], { dim: true });
    expect(isDimmedBackdropCell(out, -1, 0)).toBe(false);
    expect(isDimmedBackdropCell(out, 10, 0)).toBe(false);
    expect(isDimmedBackdropCell(filled(10, 4, 'w'), 0, 0)).toBe(false);
  });
});
