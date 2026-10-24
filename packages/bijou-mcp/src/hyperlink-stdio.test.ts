import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

describe('MCP hyperlink over stdio', () => {
  it('returns plain links while retaining Unicode layout in other tools', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve(import.meta.dirname, '../bin/bijou-mcp.js')],
      stderr: 'pipe',
      env: {
        TMPDIR: tmpdir(), NODE_DISABLE_COMPILE_CACHE: '1',
        NODE_OPTIONS: process.env['NODE_OPTIONS'] ?? '--max-old-space-size=256',
      },
    });
    let stderr = '';
    transport.stderr?.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString('utf8')).slice(-8192);
    });
    const client = new Client({ name: 'bijou-hyperlink-test', version: '1.0.0' });
    const options = { timeout: 5_000 };
    try {
      await client.connect(transport, options);
      const input = { text: 'Bijou docs', url: 'https://example.com/bijou' };
      const link = await client.callTool(
        { name: 'bijou_hyperlink', arguments: { ...input, output: 'both' } },
        CallToolResultSchema, options,
      );
      const expected = `${input.text} (${input.url})`;
      expect(link.isError).not.toBe(true);
      expect(link.content).toEqual([{ type: 'text', text: expected }]);
      expect(link.structuredContent).toEqual({ output: 'both', rendered: expected, data: input });
      const data = await client.callTool(
        { name: 'bijou_hyperlink', arguments: { ...input, fallback: 'text', output: 'data' } },
        CallToolResultSchema, options,
      );
      expect(data.content).toEqual([]);
      expect(data.structuredContent).toEqual({ output: 'data', data: { ...input, fallback: 'text' } });
      const table = await client.callTool({
        name: 'bijou_table', arguments: { columns: [{ header: 'Job' }], rows: [['compile']] },
      }, CallToolResultSchema, options);
      expect(table).toHaveProperty('content.0.text', expect.stringContaining('compile'));
      expect(table).toHaveProperty('content.0.text', expect.stringMatching(/[┌┐└┘│─]/u));
    } catch (error) {
      throw new Error(`MCP hyperlink request failed. Server stderr: ${stderr}`, { cause: error });
    } finally {
      try {
        await client.close();
      } finally {
        await transport.close();
      }
    }
  }, 30_000);
});
