import { describe, it, expect } from 'vitest';
import { wizard } from './wizard.js';

describe('wizard()', () => {
  it('transform replaces field function', async () => {
      const result = await wizard<{ mode: string; greeting: string }>({
        steps: [
          { key: 'mode', field: () => 'formal' },
          {
            key: 'greeting',
            field: () => 'hi',
            transform: (vals) => {
              if (vals.mode === 'formal') {
                return () => 'Good day';
              }
            },
          },
        ],
      });
      expect(result.values.greeting).toBe('Good day');
    });

  it('transform returning void keeps original field', async () => {
      const keepOriginal = (): void => undefined;

      const result = await wizard<{ mode: string; greeting: string }>({
        steps: [
          { key: 'mode', field: () => 'casual' },
          {
            key: 'greeting',
            field: () => 'hi',
            transform: keepOriginal,
          },
        ],
      });
      expect(result.values.greeting).toBe('hi');
    });

  it('branch splices in additional steps before subsequent steps', async () => {
      const order: string[] = [];
      const result = await wizard<{ type: string; subA: string; subB: string; final: string }>({
        steps: [
          {
            key: 'type',
            field: () => { order.push('type'); return 'advanced'; },
            branch: (vals) => {
              if (vals.type === 'advanced') {
                return [
                  { key: 'subA' as const, field: () => { order.push('subA'); return 'sub-value-A'; } },
                  { key: 'subB' as const, field: () => { order.push('subB'); return 'sub-value-B'; } },
                ];
              }
              return [];
            },
          },
          { key: 'final', field: () => { order.push('final'); return 'done'; } },
        ],
      });
      expect(order).toEqual(['type', 'subA', 'subB', 'final']);
      expect(result.values.type).toBe('advanced');
      expect(result.values.subA).toBe('sub-value-A');
      expect(result.values.subB).toBe('sub-value-B');
      expect(result.values.final).toBe('done');
    });

  it('branch returns empty array — no extra steps', async () => {
      const result = await wizard<{ type: string; final: string }>({
        steps: [
          {
            key: 'type',
            field: () => 'simple',
            branch: () => [],
          },
          { key: 'final', field: () => 'done' },
        ],
      });
      expect(result.values.type).toBe('simple');
      expect(result.values.final).toBe('done');
    });

  it('branch steps can themselves have skip predicates', async () => {
      const result = await wizard<{ mode: string; extra: string; final: string }>({
        steps: [
          {
            key: 'mode',
            field: () => 'test',
            branch: () => [
              {
                key: 'extra' as const,
                field: () => 'should-skip',
                skip: () => true,
              },
            ],
          },
          { key: 'final', field: () => 'done' },
        ],
      });
      expect(result.values.extra).toBeUndefined();
      expect(result.values.final).toBe('done');
    });

  it('transform and branch work together', async () => {
      const order: string[] = [];
      const result = await wizard<{ a: string; b: string; c: string }>({
        steps: [
          {
            key: 'a',
            field: () => 'original',
            transform: () => () => {
              order.push('transformed-a');
              return 'transformed';
            },
            branch: (vals) => {
              if (vals.a === 'transformed') {
                return [{ key: 'b' as const, field: () => { order.push('branched-b'); return 'branched'; } }];
              }
              return [];
            },
          },
          { key: 'c', field: () => { order.push('c'); return 'final'; } },
        ],
      });
      expect(order).toEqual(['transformed-a', 'branched-b', 'c']);
      expect(result.values).toEqual({ a: 'transformed', b: 'branched', c: 'final' });
    });

  it('nested branching executes in correct order', async () => {
      const order: string[] = [];
      await wizard<{ a: string; b: string; c: string; d: string }>({
        steps: [
          {
            key: 'a',
            field: () => { order.push('a'); return 'a'; },
            branch: () => [
              {
                key: 'b' as const,
                field: () => { order.push('b'); return 'b'; },
                branch: () => [
                  { key: 'c' as const, field: () => { order.push('c'); return 'c'; } },
                ],
              },
            ],
          },
          { key: 'd', field: () => { order.push('d'); return 'd'; } },
        ],
      });
      expect(order).toEqual(['a', 'b', 'c', 'd']);
    });
});
