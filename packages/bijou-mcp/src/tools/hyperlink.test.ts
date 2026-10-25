import { describe, expect, it } from 'vitest';
import { hyperlinkTool } from './hyperlink.js';

const text = 'Bijou docs';
const url = 'https://example.com/bijou';
const fallbacks = [
  { input: {}, expected: `${text} (${url})` },
  { input: { fallback: 'both' }, expected: `${text} (${url})` },
  { input: { fallback: 'text' }, expected: text },
  { input: { fallback: 'url' }, expected: url },
];

describe('MCP hyperlink plain-text contract', () => {
  describe.each(fallbacks)('fallback $input', ({ input, expected }) => {
    it.each([undefined, 'text', 'both'])('renders plain text with output %s', async (output) => {
      const result = await hyperlinkTool.handler({ text, url, ...input, ...(output ? { output } : {}) });

      expect(result.content).toEqual([{ type: 'text', text: expected }]);
      expect(result.structuredContent).toEqual({
        output: output ?? 'text', rendered: expected, data: { text, url, ...input },
      });
      expect(result.content[0]?.text).not.toContain('\u001b');
      expect(result.structuredContent?.['rendered']).not.toContain('\u001b');
    });
  });

  it('keeps data-only output semantic without rendered text', async () => {
    const result = await hyperlinkTool.handler({ text, url, fallback: 'url', output: 'data' });

    expect(result.content).toEqual([]);
    expect(result.structuredContent).toEqual({
      output: 'data', data: { text, url, fallback: 'url' },
    });
  });
});
