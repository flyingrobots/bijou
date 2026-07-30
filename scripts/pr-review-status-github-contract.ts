import type {
  PullRequestComment,
  PullRequestReview,
  PullRequestView,
} from './pr-review-status-contract.js';

export interface ReviewThreadComment {
  readonly author?: { readonly login: string } | null;
  readonly body: string;
  readonly path?: string | null;
  readonly url: string;
}

export interface ReviewThreadNode {
  readonly isResolved: boolean;
  readonly comments: { readonly nodes: readonly ReviewThreadComment[] };
}

export interface PageInfo {
  readonly hasNextPage: boolean;
  readonly endCursor?: string | null;
}

export interface PullRequestConnection<TNode> {
  readonly nodes: readonly TNode[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo;
}

export interface ReviewThreadsResponse {
  readonly data: {
    readonly repository: {
      readonly pullRequest: {
        readonly reviewThreads: PullRequestConnection<ReviewThreadNode>;
      };
    };
  };
}

interface PullRequestGraphqlNode extends Omit<
  PullRequestView,
  'comments' | 'reviews'
> {
  readonly comments: PullRequestConnection<PullRequestComment>;
  readonly reviews: PullRequestConnection<PullRequestReview>;
}

export interface PullRequestGraphqlResponse {
  readonly data: {
    readonly repository: {
      readonly pullRequest: PullRequestGraphqlNode | null;
    };
  };
}
