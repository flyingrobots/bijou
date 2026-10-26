import type {
  CodeRabbitEventKind, PullRequestComment, PullRequestReview,
} from './pr-review-status-contract.js';
import { isCodeRabbitAuthor, isSubmittedReview } from './pr-review-status-authors.js';

interface CodeRabbitEvent {
  readonly at: string;
  readonly kind: CodeRabbitEventKind;
  readonly submitted: boolean;
}

export function collectCodeRabbitEvents(
  comments: readonly PullRequestComment[],
  reviews: readonly PullRequestReview[],
): readonly CodeRabbitEvent[] {
  const commentEvents = comments
    .filter((comment) => isCodeRabbitAuthor(comment.author?.login))
    .map(commentEvent);
  const reviewEvents = reviews
    .filter(isSubmittedReview)
    .filter((review) => isCodeRabbitAuthor(review.author?.login))
    .map((review) => ({
      at: review.submittedAt,
      kind: classifyCodeRabbitBody(review.body),
      submitted: true,
    }));
  return [...commentEvents, ...reviewEvents].sort((left, right) =>
    right.at.localeCompare(left.at),
  );
}

function commentEvent(comment: PullRequestComment): CodeRabbitEvent {
  const kind = classifyCodeRabbitBody(comment.body);
  return {
    // An edit can renew a quota notice, but cannot date a new completed review.
    at: kind === 'rate_limit' ? comment.updatedAt ?? comment.createdAt : comment.createdAt,
    kind,
    submitted: false,
  };
}

function classifyCodeRabbitBody(body: string): CodeRabbitEventKind {
  const normalized = body.toLowerCase();
  if (
    normalized.includes('rate limit exceeded') ||
    normalized.includes('review limit reached') ||
    normalized.includes('<!-- this is an auto-generated comment: rate limited by coderabbit.ai -->')
  ) return 'rate_limit';
  if (normalized.includes('no actionable comments were generated in the recent review')) return 'clean';
  if (/\*\*actionable comments posted:\s*[1-9]/i.test(body)) return 'actionable';
  if (/\*\*actionable comments posted:\s*0/i.test(body)) return 'clean';
  return 'other';
}
