/** Structured bootstrap failure for Node host initialization. */
export class BijouBootstrapError extends Error {
  /** Human-readable reason for the failure. */
  readonly reason: string;
  /** Practical hint to recover from the failure. */
  readonly hint: string;
  /** Original error that triggered this bootstrap error, when available. */
  public override cause?: unknown;

  /**
   * @param reason - Root cause summary.
   * @param hint - Suggested recovery path.
   * @param cause - Optional originating error.
   */
  constructor(reason: string, hint: string, cause?: unknown) {
    super(`initDefaultContext failed: ${reason}`);
    this.name = 'BijouBootstrapError';
    this.reason = reason;
    this.hint = hint;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
