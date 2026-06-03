import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

export interface CiWorkflowTestJobPolicy {
  readonly checkoutUses: string;
  readonly checkoutFetchDepth: number;
  readonly i18nPolicyGateName: string;
  readonly i18nPolicyGateRun: string;
}

export interface CiWorkflowPolicy {
  readonly testJob: CiWorkflowTestJobPolicy;
}

export function readCiWorkflowPolicy(path: string): CiWorkflowPolicy {
  return ciWorkflowPolicyFromYaml(readFileSync(path, 'utf8'));
}

export function ciWorkflowPolicyFromYaml(source: string): CiWorkflowPolicy {
  const workflow = asRecord(parse(source), 'workflow');
  const jobs = asRecord(workflow.jobs, 'workflow.jobs');
  const testJob = asRecord(jobs.test, 'workflow.jobs.test');
  const steps = asArray(testJob.steps, 'workflow.jobs.test.steps');
  const i18nPolicyGateIndex = steps.findIndex((step) => {
    const stepRecord = asRecord(step, 'workflow.jobs.test.steps[]');
    return stepRecord.name === 'DOGFOOD i18n policy gate';
  });
  if (i18nPolicyGateIndex < 0) {
    throw new Error('CI workflow test job is missing DOGFOOD i18n policy gate step');
  }

  const checkoutStep = steps.slice(0, i18nPolicyGateIndex).map((step) => {
    return asRecord(step, 'workflow.jobs.test.steps[]');
  }).find((step) => String(step.uses ?? '').startsWith('actions/checkout@'));
  if (checkoutStep == null) {
    throw new Error('CI workflow test job is missing checkout before DOGFOOD i18n policy gate');
  }

  const checkoutWith = asRecord(checkoutStep.with, 'workflow.jobs.test.checkout.with');
  const fetchDepth = Number(checkoutWith['fetch-depth']);
  if (!Number.isFinite(fetchDepth)) {
    throw new Error('CI workflow test job checkout fetch-depth must be numeric');
  }

  const i18nPolicyGate = asRecord(steps[i18nPolicyGateIndex], 'workflow.jobs.test.i18nPolicyGate');
  return {
    testJob: {
      checkoutUses: String(checkoutStep.uses),
      checkoutFetchDepth: fetchDepth,
      i18nPolicyGateName: String(i18nPolicyGate.name),
      i18nPolicyGateRun: String(i18nPolicyGate.run ?? ''),
    },
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a mapping`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a sequence`);
  }
  return value;
}
