const HEADING = '## CI wall time by job';

/**
 * Whole seconds between two ISO timestamps, or null when either is missing or invalid.
 * @param {string | null | undefined} start
 * @param {string | null | undefined} end
 * @returns {number | null}
 */
export function wallSeconds(start, end) {
  if (start == null || end == null) return null;
  const ms = Date.parse(end) - Date.parse(start);
  return Number.isFinite(ms) && ms >= 0 ? Math.round(ms / 1000) : null;
}

/** @param {number} seconds */
export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
}

/** @param {string} name */
function cell(name) {
  return name.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * @typedef {{ name: string, start: string | null, end: string | null, conclusion: string | null }} JobRecord
 */

/**
 * Classify a job: finished jobs are ranked by wall time; skipped jobs and jobs
 * without a conclusion are listed after them and never ranked.
 * @param {JobRecord} job
 */
function classify(job) {
  if (job.conclusion === 'skipped') return { job, rank: 1, state: 'skipped', seconds: null };
  if (job.conclusion == null) return { job, rank: 2, state: 'in progress', seconds: null };
  return { job, rank: 0, state: job.conclusion, seconds: wallSeconds(job.start, job.end) };
}

/**
 * Render the Markdown job summary for a run, slowest finished job first.
 * @param {readonly JobRecord[]} jobs
 * @returns {string}
 */
export function renderSummary(jobs) {
  if (jobs.length === 0) return `${HEADING}\n\nNo jobs were reported for this run.\n`;
  const rows = jobs.map(classify).sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const byTime = (b.seconds ?? -1) - (a.seconds ?? -1);
    return byTime !== 0 ? byTime : a.job.name.localeCompare(b.job.name);
  });
  const lines = rows.map(({ job, state, seconds }, index) => {
    const wall = seconds == null ? 'n/a' : formatDuration(seconds);
    return `| ${index + 1} | ${cell(job.name)} | ${wall} | ${state} |`;
  });
  return [HEADING, '', '| # | Job | Wall time | Result |', '| ---: | --- | ---: | --- |', ...lines, ''].join('\n');
}
