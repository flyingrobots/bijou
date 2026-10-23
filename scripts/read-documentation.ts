#!/usr/bin/env tsx
import { resolve } from 'node:path';
import { readDocumentationFile } from './documentation-corpus.js';

const [path, first = '1', count = '80'] = process.argv.slice(2);
const start = Number(first);
const limit = Number(count);
if (path == null || !Number.isInteger(start) || start < 1
  || !Number.isInteger(limit) || limit < 1 || limit > 250) {
  throw new Error('Usage: read-documentation.ts PATH [START_LINE] [LIMIT:1..250]');
}
const text = readDocumentationFile(resolve(path), 'utf8');
const lines = text.split(/\r?\n/);
process.stdout.write(lines.slice(start - 1, start - 1 + limit)
  .map((line, index) => `${String(start + index)}: ${line}`).join('\n') + '\n');
