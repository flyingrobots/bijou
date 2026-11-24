import { appendFileSync } from 'node:fs';
import { renderSummary } from './summary.mjs';

const SELF_JOB = 'Wall time summary';

/** One JSON Lines record on stdout; the Markdown goes to the step summary file. */
function emit(record) {
  process.stdout.write(`${JSON.stringify({ _schema: 'bijou.ci.wall_time', version: '1.0.0', ...record })}\n`);
}

async function fetchJobs(repo, runId, token) {
  const jobs = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs?per_page=100&page=${page}`;
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
    });
    if (!response.ok) throw new Error(`jobs request failed with HTTP ${response.status}`);
    const body = await response.json();
    jobs.push(...body.jobs);
    if (body.jobs.length < 100) break;
  }
  return jobs
    .filter((job) => job.name !== SELF_JOB)
    .map((job) => ({ name: job.name, start: job.started_at, end: job.completed_at, conclusion: job.conclusion }));
}

/** Publishing is best effort: any failure is reported as a line and the exit code stays 0. */
async function main() {
  const { GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: runId, GITHUB_TOKEN: token, GITHUB_STEP_SUMMARY: target } = process.env;
  if (!repo || !runId || !token || !target) {
    emit({ event: 'skipped', reason: 'missing GitHub Actions environment' });
    return;
  }
  const jobs = await fetchJobs(repo, runId, token);
  appendFileSync(target, `${renderSummary(jobs)}\n`);
  emit({ event: 'published', jobs: jobs.length });
}

main().catch((error) => {
  emit({ event: 'error', message: error instanceof Error ? error.message : String(error) });
});
