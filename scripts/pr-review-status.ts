#!/usr/bin/env npx tsx

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PullRequestView {
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly baseRefName: string;
  readonly headRefName: string;
  readonly isDraft: boolean;
  readonly url: string;
}

interface CheckEntry {
  readonly name: string;
  readonly bucket: 'pass' | 'fail' | 'pending' | 'skipping' | 'cancel' | string;
  readonly state: string;
  readonly link?: string;
  readonly workflow?: string;
}

interface ReviewThreadComment {
  readonly author: { readonly login: string };
  readonly body: string;
  readonly path?: string | null;
  readonly url: string;
}

interface ReviewThreadNode {
  readonly isResolved: boolean;
  readonly comments: { readonly nodes: readonly ReviewThreadComment[] };
}

interface ReviewThreadsResponse {
  readonly data: {
    readonly repository: {
      readonly pullRequest: {
        readonly reviewThreads: {
          readonly nodes: readonly ReviewThreadNode[];
        };
      };
    };
  };
}

export interface CheckSummary {
  readonly counts: Readonly<Record<string, number>>;
  readonly failing: readonly CheckEntry[];
  readonly pending: readonly CheckEntry[];
  readonly codeRabbit: CheckEntry | null;
}

export interface UnresolvedFinding {
  readonly author: string;
  readonly path: string;
  readonly url: string;
  readonly summary: string;
}

export function summarizeChecks(checks: readonly CheckEntry[]): CheckSummary {
  const counts: Record<string, number> = {
    pass: 0,
    fail: 0,
    pending: 0,
    skipping: 0,
    cancel: 0,
    other: 0,
  };

  for (const check of checks) {
    if (check.bucket in counts) {
      counts[check.bucket] += 1;
    } else {
      counts.other += 1;
    }
  }

  return {
    counts,
    failing: checks.filter((check) => check.bucket === 'fail'),
    pending: checks.filter((check) => check.bucket === 'pending'),
    codeRabbit: checks.find((check) => check.name === 'CodeRabbit') ?? null,
  };
}

export function extractUnresolvedFindings(threads: readonly ReviewThreadNode[]): readonly UnresolvedFinding[] {
  return threads
    .filter((thread) => !thread.isResolved)
    .map((thread) => thread.comments.nodes[0])
    .filter((comment): comment is ReviewThreadComment => comment != null)
    .map((comment) => ({
      author: comment.author.login,
      path: comment.path ?? '(no file)',
      url: comment.url,
      summary: summarizeComment(comment.body),
    }));
}

export function computeExitCode(summary: CheckSummary, unresolvedCount: number): number {
  if (summary.failing.length > 0 || unresolvedCount > 0) {
    return 1;
  }

  if (summary.pending.length > 0) {
    return 8;
  }

  return 0;
}

function main(): void {
  const prArg = process.argv[2];
  const pr = ghJson<PullRequestView>([
    'pr',
    'view',
    ...maybeArg(prArg),
    '--json',
    'number,title,state,baseRefName,headRefName,isDraft,url',
  ]);
  const checks = ghJson<CheckEntry[]>([
    'pr',
    'checks',
    String(pr.number),
    '--json',
    'name,bucket,state,link,workflow',
  ]);
  const threads = fetchReviewThreads(pr.number);
  const unresolved = extractUnresolvedFindings(threads);
  const summary = summarizeChecks(checks);

  process.stdout.write(`PR #${pr.number}: ${pr.title}\n`);
  process.stdout.write(`State: ${pr.state}${pr.isDraft ? ' (draft)' : ''}\n`);
  process.stdout.write(`Branch: ${pr.headRefName} -> ${pr.baseRefName}\n`);
  process.stdout.write(`URL: ${pr.url}\n\n`);

  process.stdout.write(
    `Checks: pass=${summary.counts.pass} pending=${summary.counts.pending} fail=${summary.counts.fail} skipping=${summary.counts.skipping} cancel=${summary.counts.cancel}\n`,
  );
  process.stdout.write(`Unresolved threads: ${unresolved.length}\n`);
  process.stdout.write(`CodeRabbit: ${summary.codeRabbit?.bucket ?? 'missing'}\n`);

  if (summary.failing.length > 0) {
    process.stdout.write('\nFailing checks:\n');
    for (const check of summary.failing) {
      process.stdout.write(`- ${check.name} (${check.state})${check.link ? ` ${check.link}` : ''}\n`);
    }
  }

  if (summary.pending.length > 0) {
    process.stdout.write('\nPending checks:\n');
    for (const check of summary.pending) {
      process.stdout.write(`- ${check.name} (${check.state})${check.link ? ` ${check.link}` : ''}\n`);
    }
  }

  if (unresolved.length > 0) {
    process.stdout.write('\nUnresolved review threads:\n');
    for (const finding of unresolved) {
      process.stdout.write(`- [${finding.author}] ${finding.path}: ${finding.summary}\n  ${finding.url}\n`);
    }
  }

  process.exitCode = computeExitCode(summary, unresolved.length);
}

function fetchReviewThreads(prNumber: number): readonly ReviewThreadNode[] {
  const query = `
query($prNumber: Int!) {
  repository(owner: "flyingrobots", name: "bijou") {
    pullRequest(number: $prNumber) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          comments(first: 20) {
            nodes {
              author { login }
              body
              path
              url
            }
          }
        }
      }
    }
  }
}
`;

  const payload = ghGraphql<ReviewThreadsResponse>(query, { prNumber: String(prNumber) });
  return payload.data.repository.pullRequest.reviewThreads.nodes;
}

function summarizeComment(body: string): string {
  const firstLine = body
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('<!--') && !line.startsWith('<details>') && !line.startsWith('</details>'));

  return firstLine == null ? '(no summary)' : firstLine.slice(0, 140);
}

function ghJson<T>(args: readonly string[]): T {
  const output = execFileSync('gh', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      GH_PAGER: 'cat',
    },
  });

  return JSON.parse(output) as T;
}

function ghGraphql<T>(query: string, variables: Readonly<Record<string, string>>): T {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, value] of Object.entries(variables)) {
    args.push('-F', `${key}=${value}`);
  }

  const output = execFileSync('gh', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      GH_PAGER: 'cat',
    },
  });

  return JSON.parse(output) as T;
}

function maybeArg(value: string | undefined): readonly string[] {
  return value == null || value === '' ? [] : [value];
}

if (process.argv[1] != null && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
