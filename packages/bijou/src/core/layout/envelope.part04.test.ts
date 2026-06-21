import { describe, expect, it } from 'vitest';
import { contentExtentFromBuffer, contentExtentFromSurface, measureTextContent } from './envelope.js';

describe('content measurement seam', () => {
  it('reports surface and buffer cell extents directly', () => {
    expect(contentExtentFromSurface({ width: 40, height: 7 })).toEqual({
      source: 'surface',
      inlineSize: 40,
      blockSize: 7,
      facts: [],
    });
    expect(contentExtentFromBuffer({ width: 18.9, height: 3.1 })).toEqual({
      source: 'buffer',
      inlineSize: 18,
      blockSize: 3,
      facts: [],
    });
  });

  it('keeps text-to-cell measurement behind an injected adapter', () => {
    const calls: unknown[] = [];
    const measured = measureTextContent({
      text: 'wide copy',
      availableInline: 5,
      direction: 'rtl',
      wrap: 'word',
      adapter(input) {
        calls.push(input);
        return {
          inlineSize: 5,
          blockSize: 2,
          facts: [{ kind: 'measurement', key: 'adapter', value: 'test' }],
        };
      },
    });

    expect(measured).toEqual({
      source: 'text',
      inlineSize: 5,
      blockSize: 2,
      facts: [{ kind: 'measurement', key: 'adapter', value: 'test' }],
    });
    expect(calls).toEqual([{
      text: 'wide copy',
      availableInline: 5,
      direction: 'rtl',
      wrap: 'word',
    }]);
  });
});
