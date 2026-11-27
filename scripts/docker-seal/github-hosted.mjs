import { existsSync } from 'node:fs';
import { isAbsolute } from 'node:path';

/**
 * True only in a GitHub-hosted Actions job, which GitHub runs on a virtual
 * machine of its own and discards afterwards. A self-hosted runner, or a
 * shell that merely sets GITHUB_ACTIONS, does not pass.
 */
export function isGitHubHostedJob(env = process.env) {
  const temp = env.RUNNER_TEMP ?? '';
  return env.GITHUB_ACTIONS === 'true' && env.RUNNER_ENVIRONMENT === 'github-hosted'
    && isAbsolute(temp) && existsSync(temp) && /^\d+$/u.test(env.GITHUB_RUN_ID ?? '');
}
