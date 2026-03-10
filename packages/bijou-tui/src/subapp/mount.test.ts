import { describe, it, expect, vi } from 'vitest';
import { mount, mapCmds } from './mount.js';
import type { App, Cmd, QuitSignal } from '../types.js';
import { QUIT } from '../types.js';
import { createSurface } from '@flyingrobots/bijou';

describe('mount', () => {
  it('returns the sub-app surface', () => {
    const mockSurface = createSurface(10, 10);
    const mockApp: App<number, any> = {
      init: () => [0, []],
      update: (m) => [0, []],
      view: () => mockSurface,
    };

    const [surface] = mount(mockApp, {
      model: 42,
      onMsg: (m) => m,
    });

    expect(surface).toBe(mockSurface);
  });
});

describe('mapCmds', () => {
  it('maps emitted messages to the parent type', async () => {
    type SubMsg = { sub: true; val: number };
    type ParentMsg = { parent: true; val: number };

    const cmd: Cmd<SubMsg> = async (emit) => {
      emit({ sub: true, val: 1 });
      return { sub: true, val: 2 };
    };

    const mapped = mapCmds([cmd], (msg) => ({ parent: true, val: msg.val }));
    expect(mapped).toHaveLength(1);

    const emitted: ParentMsg[] = [];
    const mockCaps = {
      onPulse: vi.fn(),
    };

    const result = await mapped[0]!((m) => emitted.push(m), mockCaps);

    expect(emitted).toEqual([{ parent: true, val: 1 }]);
    expect(result).toEqual({ parent: true, val: 2 });
  });

  it('passes QUIT signals through unaltered', async () => {
    const cmd: Cmd<any> = async () => QUIT as QuitSignal;
    const mapped = mapCmds([cmd], (m) => m);

    const result = await mapped[0]!(vi.fn(), { onPulse: vi.fn() });
    expect(result).toBe(QUIT);
  });
});
