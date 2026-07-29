import { readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
export interface WorkflowShellStep {
  readonly workflowPath: string;
  readonly stepName: string;
  readonly shell: string | null;
  readonly script: string;
  readonly line: number;
}
export interface WorkflowShellPreflightIO {
  readonly cwd?: string;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}
export function countLeadingSpaces(line: string): number {
  return line.length - line.trimStart().length;
}
export function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
export function listWorkflowFiles(root: string): readonly string[] {
  const workflowsDir = resolve(root, '.github/workflows');
  return readdirSync(workflowsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(ya?ml)$/.test(entry.name))
    .map((entry) => join(workflowsDir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}
export function sanitizeGithubExpressions(script: string): string {
  return script.replace(/\$\{\{[\s\S]*?\}\}/g, '__GITHUB_EXPR__');
}
export function shouldValidateShell(shell: string | null): boolean {
  if (shell == null || shell.trim() === '') return true;
  return shell.trim().toLowerCase().startsWith('bash');
}
