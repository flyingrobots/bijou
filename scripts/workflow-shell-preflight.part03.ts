import { spawnSync } from 'node:child_process';
import {
  countLeadingSpaces,
  sanitizeGithubExpressions,
} from './workflow-shell-preflight.part01.js';

export function readYamlBlock(
  stepLines: readonly string[],
  startIndex: number,
  parentIndent: number,
): string {
  let blockIndent: number | null = null;
  const blockLines: string[] = [];

  for (let index = startIndex + 1; index < stepLines.length; index += 1) {
    const line = stepLines[index];
    if (line === undefined) break;
    if (line.trim() === '') {
      if (blockIndent != null) {
        blockLines.push('');
      }
      continue;
    }

    const indent = countLeadingSpaces(line);
    if (indent <= parentIndent) {
      break;
    }

    blockIndent ??= indent;
    blockLines.push(line.slice(blockIndent));
  }

  while (blockLines.length > 0 && blockLines[blockLines.length - 1] === '') {
    blockLines.pop();
  }

  return blockLines.join('\n');
}
export function validateShellScript(script: string): string | null {
  const result = spawnSync('bash', ['-n'], {
    encoding: 'utf8',
    input: sanitizeGithubExpressions(script),
  });

  if (result.error != null) {
    return result.error.message;
  }

  if (result.status === 0) {
    return null;
  }

  return [result.stdout.trim(), result.stderr.trim()]
    .filter(Boolean)
    .join('\n');
}
