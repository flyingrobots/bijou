import { describe, expect, it } from 'vitest';
import { appendRuntimeCommands, appendRuntimeEffects, applyRuntimeCommandBuffer, bufferRuntimeRouteResult, createRuntimeBuffers, createRuntimeCommandBuffer, createRuntimeEffectBuffer, executeRuntimeEffectBuffer } from './runtime-engine.js';

describe('runtime command and effect buffers', () => {
  it('creates explicit empty command and effect buffers', () => {
    expect(createRuntimeCommandBuffer<string>()).toEqual({
      items: [],
    });
    expect(createRuntimeEffectBuffer<string>()).toEqual({
      items: [],
    });
    expect(createRuntimeBuffers<string, string>()).toEqual({
      commands: { items: [] },
      effects: { items: [] },
    });
  });
  it('buffers route outputs without collapsing commands and effects together', () => {
    const buffered = bufferRuntimeRouteResult(createRuntimeBuffers<string, string>(), {
      handled: true,
      commands: ['open-modal', 'focus-confirm'],
      effects: ['play-click'],
      visitedViewIds: ['modal'],
    });
    expect(buffered.commands.items).toEqual(['open-modal', 'focus-confirm']);
    expect(buffered.effects.items).toEqual(['play-click']);
  });
  it('appends multiple route results in FIFO order', () => {
    const first = bufferRuntimeRouteResult(createRuntimeBuffers<string, string>(), {
      handled: true,
      commands: ['search.select'],
      effects: ['announce.selection'],
      visitedViewIds: ['search'],
    });
    const second = bufferRuntimeRouteResult(first, {
      handled: true,
      commands: ['workspace.focus', 'track.selection'],
      effects: ['flash.row'],
      visitedViewIds: ['workspace'],
    });
    expect(second.commands.items).toEqual([
      'search.select',
      'workspace.focus',
      'track.selection',
    ]);
    expect(second.effects.items).toEqual([
      'announce.selection',
      'flash.row',
    ]);
  });
  it('leaves buffers unchanged when a handled input emits nothing', () => {
    const initial = {
      commands: appendRuntimeCommands(createRuntimeCommandBuffer<string>(), ['keep.command']),
      effects: appendRuntimeEffects(createRuntimeEffectBuffer<string>(), ['keep.effect']),
    };
    const next = bufferRuntimeRouteResult(initial, {
      handled: true,
      commands: [],
      effects: [],
      visitedViewIds: ['workspace'],
    });
    expect(next).toEqual(initial);
  });
  it('applies buffered commands later in FIFO order and drains the command buffer', () => {
    const applied: string[] = [];
    const commandBuffer = appendRuntimeCommands(createRuntimeCommandBuffer<string>(), [
      'one',
      'two',
      'three',
    ]);
    const result = applyRuntimeCommandBuffer({ order: Array<string>() }, commandBuffer, (state, command) => {
      applied.push(command);
      return {
        order: [...state.order, command],
      };
    });
    expect(applied).toEqual(['one', 'two', 'three']);
    expect(result.state.order).toEqual(['one', 'two', 'three']);
    expect(result.applied).toEqual(['one', 'two', 'three']);
    expect(result.buffer).toEqual({ items: [] });
  });
  it('executes buffered effects later in FIFO order and drains the effect buffer', async () => {
    const executed: string[] = [];
    const effectBuffer = appendRuntimeEffects(createRuntimeEffectBuffer<string>(), [
      'play-click',
      'announce.confirm',
    ]);
    const result = await executeRuntimeEffectBuffer(effectBuffer, (effect) => {
      executed.push(effect);
    });
    expect(executed).toEqual(['play-click', 'announce.confirm']);
    expect(result.executed).toEqual(['play-click', 'announce.confirm']);
    expect(result.buffer).toEqual({ items: [] });
  });
});
