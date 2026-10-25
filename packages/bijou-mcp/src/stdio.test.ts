import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';

describe('MCP stdio compatibility', () => {
  it('initializes, discovers tools, renders text/data, and survives invalid arguments', async () => {
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
    const client = new Client({ name: 'bijou-compatibility-test', version: '1.0.0' });
    const options = { timeout: 5_000 };
    try {
      await client.connect(transport, options);
      expect(client.getServerVersion()?.name).toBe('bijou-mcp');
      const { tools } = await client.listTools(undefined, options);
      expect(tools.map(({ name }) => name)).toEqual(
        expect.arrayContaining(['bijou_table', 'bijou_docs']),
      );
      const tableSchema = tools.find(({ name }) => name === 'bijou_table');
      expect(tableSchema).toHaveProperty('inputSchema.required', expect.arrayContaining(['columns', 'rows']));
      expect(tableSchema).toHaveProperty('inputSchema.properties.rows.items.items.type', 'string');
      expect(tableSchema).toHaveProperty('outputSchema.required', expect.arrayContaining(['output', 'data']));
      expect(tableSchema).toHaveProperty('outputSchema.properties.rendered.type', 'string');
      expect(tableSchema).toHaveProperty('outputSchema.properties.data.type', 'object');
      const linkSchema = tools.find(({ name }) => name === 'bijou_hyperlink');
      expect(linkSchema).toHaveProperty('inputSchema.required', expect.arrayContaining(['text', 'url']));
      expect(linkSchema).toHaveProperty('inputSchema.properties.fallback.enum', ['url', 'text', 'both']);
      const input = { columns: [{ header: 'Job' }], rows: [['compile']] };
      const table = await client.callTool(
        { name: 'bijou_table', arguments: { ...input, output: 'both' } },
        CallToolResultSchema, options,
      );
      expect(table.isError).not.toBe(true);
      expect(table.content).toHaveLength(1);
      expect(table).toHaveProperty('content.0.type', 'text');
      expect(table).toHaveProperty('content.0.text', expect.stringContaining('compile'));
      expect(table.structuredContent).toMatchObject({
        output: 'both', data: input,
      });
      expect(table).toHaveProperty('structuredContent.rendered', expect.stringContaining('compile'));
      const invalid = await client.callTool(
        { name: 'bijou_table', arguments: {} }, CallToolResultSchema, options,
      );
      expect(invalid.isError).toBe(true);
      const data = await client.callTool(
        { name: 'bijou_table', arguments: { ...input, output: 'data' } },
        CallToolResultSchema, options,
      );
      expect(data.content).toEqual([]);
      expect(data.structuredContent).toEqual({ output: 'data', data: input });
      const docs = await client.callTool(
        { name: 'bijou_docs', arguments: { query: 'table', output: 'both' } },
        CallToolResultSchema, options,
      );
      expect(docs.isError).not.toBe(true);
      expect(docs.structuredContent).toMatchObject({
        output: 'both',
      });
      expect(docs).toHaveProperty('structuredContent.rendered', expect.stringContaining('bijou_table'));
    } catch (error) {
      throw new Error(`MCP stdio compatibility failed. Server stderr: ${stderr}`, { cause: error });
    } finally {
      try {
        await client.close();
      } finally {
        await transport.close();
      }
    }
  }, 60_000);
});
