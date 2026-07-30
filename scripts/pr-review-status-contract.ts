export interface PullRequestView {
  readonly number: number;
  readonly title: string;
  readonly state: string;
  readonly baseRefName: string;
  readonly headRefName: string;
  readonly isDraft: boolean;
  readonly url: string;
  readonly reviewDecision?: string | null;
  readonly mergeStateStatus?: string | null;
  readonly comments: readonly PullRequestComment[];
  readonly reviews: readonly PullRequestReview[];
}

export interface CheckEntry {
  readonly name: string;
  readonly bucket: string;
  readonly state: string;
  readonly link?: string;
  readonly workflow?: string;
}

export interface PullRequestComment {
  readonly author?: {
    readonly login: string;
    readonly __typename?: string;
  } | null;
  readonly body: string;
  readonly createdAt: string;
}

export interface PullRequestReview {
  readonly author?: {
    readonly login: string;
    readonly __typename?: string;
  } | null;
  readonly body: string;
  readonly submittedAt: string | null;
  readonly state: string;
}

export interface CheckSummary {
  readonly counts: Readonly<Record<string, number>>;
  readonly failing: readonly CheckEntry[];
  readonly pending: readonly CheckEntry[];
  readonly canceled: readonly CheckEntry[];
  readonly codeRabbit: CheckEntry | null;
}

export interface UnresolvedFinding {
  readonly author: string;
  readonly path: string;
  readonly url: string;
  readonly summary: string;
}

export interface ReviewSummary {
  readonly total: number;
  readonly approvals: number;
  readonly changesRequested: number;
  readonly comments: number;
  readonly byState: Readonly<Record<string, number>>;
}

export type CodeRabbitEventKind =
  'rate_limit' | 'clean' | 'actionable' | 'other';

export type SubmittedReview = PullRequestReview & {
  readonly submittedAt: string;
};

export interface CodeRabbitStatus {
  readonly state:
    | 'missing'
    | 'pass'
    | 'pending'
    | 'failing'
    | 'rate_limited'
    | 'actionable'
    | 'clean'
    | 'commented';
  readonly detail: string;
  readonly latestKind: CodeRabbitEventKind | 'none';
  readonly staleRateLimitCount: number;
  readonly activeRateLimitCount: number;
}

export interface MergeReadiness {
  readonly status: 'ready' | 'pending' | 'blocked';
  readonly reasons: readonly string[];
}

export interface ReviewStatusOptions {
  readonly mergeReady: boolean;
  readonly minReviews: number;
  readonly prArg?: string;
}

export interface ReviewStatusReport {
  readonly pr: PullRequestView;
  readonly checks: CheckSummary;
  readonly unresolved: readonly UnresolvedFinding[];
  readonly reviews: ReviewSummary;
  readonly codeRabbit: CodeRabbitStatus;
  readonly readiness: MergeReadiness;
  readonly options: ReviewStatusOptions;
}
