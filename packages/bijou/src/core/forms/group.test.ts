import { describe, it, expect } from 'vitest';
import { group } from './group.js';

describe('group', () => {
  it('collects results from field functions', async () => {
    const result = await group({
      name: () => Promise.resolve('Alice'),
      age: () => Promise.resolve(30),
    });
    expect(result.values.name).toBe('Alice');
    expect(result.values.age).toBe(30);
    expect(result.cancelled).toBe(false);
  });

  it('executes fields in order', async () => {
    const order: string[] = [];
    await group({
      first: () => { order.push('first'); return Promise.resolve(1); },
      second: () => { order.push('second'); return Promise.resolve(2); },
      third: () => { order.push('third'); return Promise.resolve(3); },
    });
    expect(order).toEqual(['first', 'second', 'third']);
  });

  it('handles single field', async () => {
    const result = await group({
      only: () => Promise.resolve('value'),
    });
    expect(result.values.only).toBe('value');
  });

  it('propagates error when a child field rejects (cancellation)', async () => {
    await expect(
      group({
        name: () => Promise.resolve('Alice'),
        age: () => Promise.reject(new Error('cancelled')),
      }),
    ).rejects.toThrow('cancelled');
  });

  it('does not run subsequent fields after cancellation', async () => {
    const order: string[] = [];
    await expect(
      group({
        first: () => { order.push('first'); return Promise.resolve(1); },
        second: () => { order.push('second'); return Promise.reject(new Error('cancelled')); },
        third: () => { order.push('third'); return Promise.resolve(3); },
      }),
    ).rejects.toThrow('cancelled');
    expect(order).toEqual(['first', 'second']);
  });
});
