import { describe, it, expect, vi } from 'vitest';
import { initSubApp, mount, mapCmds, updateSubApp } from './mount.js';
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

    const mapped = mapCmds([cmd], (msg) => ({ parent: true as const, val: msg.val }));
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
    const cmd: Cmd<any> = () => QUIT as QuitSignal;
    const mapped = mapCmds([cmd], (m) => m);

    const result = await mapped[0]!(vi.fn(), { onPulse: vi.fn() });
    expect(result).toBe(QUIT);
  });

  it('passes cleanup handles through unaltered', async () => {
    type SubMsg = { sub: true; val: number };
    type ParentMsg = { parent: true; val: number };
    const dispose = vi.fn();
    const handle = { dispose };

    const cmd: Cmd<SubMsg> = () => handle;
    const mapped = mapCmds([cmd], (msg) => ({ parent: true as const, val: msg.val }));

    const result = await mapped[0]!(vi.fn(), { onPulse: vi.fn() });
    expect(result).toBe(handle);
    expect(dispose).not.toHaveBeenCalled();
  });
});

describe('initSubApp', () => {
  it('returns the child model and mapped init commands', async () => {
    type SubMsg = { type: 'ready'; value: number };
    type ParentMsg = { type: 'child'; value: number };

    const child: App<number, SubMsg> = {
      init: () => [7, [async () => ({ type: 'ready', value: 7 })]],
      update: (_msg, model) => [model, []],
      view: () => createSurface(1, 1),
    };

    const [model, cmds] = initSubApp(child, {
      onMsg: (msg) => ({ type: 'child', value: msg.value }),
    });

    expect(model).toBe(7);
    expect(cmds).toHaveLength(1);
    await expect(cmds[0]!(vi.fn(), { onPulse: vi.fn() })).resolves.toEqual({ type: 'child', value: 7 });
  });
});

describe('updateSubApp', () => {
  it('maps returned commands into the parent message space', async () => {
    type SubMsg = { type: 'inc' };
    type ParentMsg = { type: 'left'; inner: SubMsg };

    const child: App<number, SubMsg> = {
      init: () => [0, []],
      update: (_msg, model) => [model + 1, [async () => ({ type: 'inc' })]],
      view: () => createSurface(1, 1),
    };

    const [nextModel, cmds] = updateSubApp(child, { type: 'inc' }, 1, {
      onMsg: (msg) => ({ type: 'left', inner: msg }),
    });

    expect(nextModel).toBe(2);
    expect(cmds).toHaveLength(1);
    await expect(cmds[0]!(vi.fn(), { onPulse: vi.fn() })).resolves.toEqual({
      type: 'left',
      inner: { type: 'inc' },
    });
  });

  it('passes QUIT through when mapping child commands', async () => {
    type SubMsg = { type: 'noop' };
    type ParentMsg = { type: 'parent-noop' };

    const child: App<number, SubMsg> = {
      init: () => [0, []],
      update: (_msg, model) => [model, [() => QUIT as QuitSignal]],
      view: () => createSurface(1, 1),
    };

    const [, cmds] = updateSubApp(child, { type: 'noop' }, 0, {
      onMsg: () => ({ type: 'parent-noop' }),
    });

    await expect(cmds[0]!(vi.fn(), { onPulse: vi.fn() })).resolves.toBe(QUIT);
  });
});
