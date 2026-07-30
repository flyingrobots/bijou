import type {
  PullRequestComment,
  PullRequestReview,
  SubmittedReview,
} from './pr-review-status-contract.js';

export function isCodeRabbitAuthor(login: string | undefined): boolean {
  return login != null && /^coderabbitai(?:\[bot\])?$/i.test(login);
}

export function isSubmittedReview(
  review: PullRequestReview,
): review is SubmittedReview {
  return review.submittedAt != null && review.state !== 'PENDING';
}

export function isAutomatedReviewer(
  author: PullRequestReview['author'] | PullRequestComment['author'],
): boolean {
  if (author?.__typename != null) return author.__typename !== 'User';
  const login = author?.login;
  return (
    login != null && (isCodeRabbitAuthor(login) || login.endsWith('[bot]'))
  );
}
