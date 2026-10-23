// Copyright 2026 James Ross. SPDX-License-Identifier: Apache-2.0
import type { JobStatus } from './protocol.js';
export class Job {
  public constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly status: JobStatus = 'queued',
    public readonly percent = 0,
    public readonly run = 0,
    public readonly error: string | undefined = undefined,
  ) {
    if (!id.trim() || !title.trim()) throw new Error('Job identity and title are required');
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error('Progress must be 0..100');
    if (!Number.isSafeInteger(run) || run < 0) throw new Error('Run identity must be a non-negative integer');
    if (status === 'succeeded' && percent !== 100) throw new Error('Successful jobs must be complete');
    Object.freeze(this);
  }
  public start(): Job { return new Job(this.id, this.title, 'running', 0, this.run + 1); }
  public cancel(): Job { return new Job(this.id, this.title, 'cancelled', this.percent, this.run + 1); }
}
