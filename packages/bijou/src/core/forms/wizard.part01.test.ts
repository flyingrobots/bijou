import { describe, it, expect } from 'vitest';
import { wizard } from './wizard.js';

describe('wizard()', () => {
  it('runs all steps and collects values', async () => {
      const result = await wizard<{ name: string; age: number; active: boolean }>({
        steps: [
          { key: 'name', field: () => 'Alice' },
          { key: 'age', field: () => 30 },
          { key: 'active', field: () => true },
        ],
      });
      expect(result).toEqual({
        values: { name: 'Alice', age: 30, active: true },
        cancelled: false,
      });
    });

  it('skips step when skip predicate returns true', async () => {
      const result = await wizard<{ mode: string; details: string }>({
        steps: [
          { key: 'mode', field: () => 'simple' },
          {
            key: 'details',
            field: () => 'extra info',
            skip: (values) => values.mode === 'simple',
          },
        ],
      });
      expect(result.values.mode).toBe('simple');
      expect(result.values.details).toBeUndefined();
      expect(result.cancelled).toBe(false);
    });

  it('does not skip when skip predicate returns false', async () => {
      const result = await wizard<{ mode: string; details: string }>({
        steps: [
          { key: 'mode', field: () => 'advanced' },
          {
            key: 'details',
            field: () => 'extra info',
            skip: (values) => values.mode === 'simple',
          },
        ],
      });
      expect(result.values.mode).toBe('advanced');
      expect(result.values.details).toBe('extra info');
    });

  it('empty steps returns empty values', async () => {
      const result = await wizard<Record<string, never>>({
        steps: [],
      });
      expect(result).toEqual({ values: {}, cancelled: false });
    });

  it('field receives accumulated values', async () => {
      const received: Partial<{ a: string; b: string }>[] = [];
      await wizard<{ a: string; b: string }>({
        steps: [
          {
            key: 'a',
            field: (vals) => {
              received.push({ ...vals });
              return 'first';
            },
          },
          {
            key: 'b',
            field: (vals) => {
              received.push({ ...vals });
              return 'second';
            },
          },
        ],
      });
      expect(received[0]).toEqual({});
      expect(received[1]).toEqual({ a: 'first' });
    });

  it('steps run sequentially', async () => {
      const order: number[] = [];
      await wizard<{ a: string; b: string; c: string }>({
        steps: [
          {
            key: 'a',
            field: () => {
              order.push(1);
              return 'a';
            },
          },
          {
            key: 'b',
            field: () => {
              order.push(2);
              return 'b';
            },
          },
          {
            key: 'c',
            field: () => {
              order.push(3);
              return 'c';
            },
          },
        ],
      });
      expect(order).toEqual([1, 2, 3]);
    });

  it('propagates error when a step rejects (cancellation)', async () => {
      await expect(
        wizard<{ a: string; b: string }>({
          steps: [
            { key: 'a', field: () => 'first' },
            { key: 'b', field: () => { throw new Error('cancelled'); } },
          ],
        }),
      ).rejects.toThrow('cancelled');
    });

  it('does not run subsequent steps after cancellation', async () => {
      const order: number[] = [];
      await expect(
        wizard<{ a: string; b: string; c: string }>({
          steps: [
            { key: 'a', field: () => { order.push(1); return 'a'; } },
            { key: 'b', field: () => { order.push(2); throw new Error('cancelled'); } },
            { key: 'c', field: () => { order.push(3); return 'c'; } },
          ],
        }),
      ).rejects.toThrow('cancelled');
      expect(order).toEqual([1, 2]);
    });
});
