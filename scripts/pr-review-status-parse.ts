import { execFileSync } from 'node:child_process';
import type {
  CheckEntry,
  PageInfo,
  PullRequestComment,
  PullRequestConnection,
  PullRequestGraphqlResponse,
  PullRequestReview,
  ReviewThreadComment,
  ReviewThreadNode,
  ReviewThreadsResponse,
} from './pr-review-status.js';

export function ghJson<T>(args: readonly string[], isValue: (value: unknown) => value is T): T {
  const output = execFileSync('gh', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, GH_PAGER: 'cat' },
  });
  const parsed: unknown = JSON.parse(output);
  if (!isValue(parsed)) throw new Error(`unexpected gh JSON response for gh ${args.join(' ')}`);
  return parsed;
}

export function ghGraphql<T>(
  query: string,
  variables: Readonly<Record<string, string>>,
  isValue: (value: unknown) => value is T,
): T {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [key, value] of Object.entries(variables)) args.push('-F', `${key}=${value}`);
  const output = execFileSync('gh', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, GH_PAGER: 'cat' },
  });
  const parsed: unknown = JSON.parse(output);
  if (!isValue(parsed)) throw new Error('unexpected gh GraphQL response shape');
  return parsed;
}

export function isPrNumberPayload(value: unknown): value is { readonly number: number } {
  return isRecord(value) && typeof value.number === 'number' && Number.isInteger(value.number);
}

export function isCheckEntries(value: unknown): value is readonly CheckEntry[] {
  return Array.isArray(value) && value.every(isCheckEntry);
}

export function isReviewThreadsResponse(value: unknown): value is ReviewThreadsResponse {
  const pullRequest = graphqlPullRequest(value);
  return isRecord(pullRequest) && isConnection(pullRequest.reviewThreads, isReviewThreadNode);
}

export function isPullRequestGraphqlResponse(value: unknown): value is PullRequestGraphqlResponse {
  const pullRequest = graphqlPullRequest(value);
  return pullRequest === null || (isRecord(pullRequest)
    && typeof pullRequest.number === 'number'
    && typeof pullRequest.title === 'string'
    && typeof pullRequest.state === 'string'
    && typeof pullRequest.baseRefName === 'string'
    && typeof pullRequest.headRefName === 'string'
    && typeof pullRequest.isDraft === 'boolean'
    && typeof pullRequest.url === 'string'
    && isOptionalString(pullRequest.reviewDecision)
    && isOptionalString(pullRequest.mergeStateStatus)
    && isConnection(pullRequest.comments, isPullRequestComment)
    && isConnection(pullRequest.reviews, isPullRequestReview));
}

function isCheckEntry(value: unknown): value is CheckEntry {
  return isRecord(value)
    && typeof value.name === 'string'
    && typeof value.bucket === 'string'
    && typeof value.state === 'string'
    && isOptionalString(value.link)
    && isOptionalString(value.workflow);
}

function graphqlPullRequest(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.repository)) return undefined;
  return value.data.repository.pullRequest;
}

function isConnection<T>(value: unknown, isNode: (node: unknown) => node is T): value is PullRequestConnection<T> {
  return isRecord(value)
    && Array.isArray(value.nodes)
    && value.nodes.every(isNode)
    && typeof value.totalCount === 'number'
    && isPageInfo(value.pageInfo);
}

function isPageInfo(value: unknown): value is PageInfo {
  return isRecord(value) && typeof value.hasNextPage === 'boolean' && isOptionalString(value.endCursor);
}

function isReviewThreadNode(value: unknown): value is ReviewThreadNode {
  return isRecord(value)
    && typeof value.isResolved === 'boolean'
    && isRecord(value.comments)
    && Array.isArray(value.comments.nodes)
    && value.comments.nodes.every(isReviewThreadComment);
}

function isReviewThreadComment(value: unknown): value is ReviewThreadComment {
  return isRecord(value)
    && isOptionalAuthor(value.author)
    && typeof value.body === 'string'
    && isOptionalString(value.path)
    && typeof value.url === 'string';
}

function isPullRequestComment(value: unknown): value is PullRequestComment {
  return isRecord(value) && isOptionalAuthor(value.author) && typeof value.body === 'string' && typeof value.createdAt === 'string';
}

function isPullRequestReview(value: unknown): value is PullRequestReview {
  return isRecord(value)
    && isOptionalAuthor(value.author)
    && typeof value.body === 'string'
    && isOptionalString(value.submittedAt)
    && typeof value.state === 'string';
}

function isOptionalAuthor(value: unknown): value is PullRequestComment['author'] {
  return value == null || (isRecord(value) && typeof value.login === 'string' && isOptionalString(value.__typename));
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value == null || typeof value === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
