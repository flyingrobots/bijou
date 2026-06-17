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
  readonly focusedUnitTestsJob: {
    readonly permissionsContents: string | undefined;
    readonly focusedPortableRun: string;
  };
}

export function readCiWorkflowPolicy(path: string): CiWorkflowPolicy {
  return ciWorkflowPolicyFromYaml(readFileSync(path, 'utf8'));
}

export function ciWorkflowPolicyFromYaml(source: string): CiWorkflowPolicy {
  const workflow = asRecord(parse(source), 'workflow');
  const jobs = asRecord(workflow.jobs, 'workflow.jobs');
  const testJob = asRecord(jobs.test, 'workflow.jobs.test');
  const focusedUnitTestsJob = asRecord(jobs.unit_cross_platform, 'workflow.jobs.unit_cross_platform');
  const focusedUnitTestsPermissions = focusedUnitTestsJob.permissions == null
    ? undefined
    : asRecord(focusedUnitTestsJob.permissions, 'workflow.jobs.unit_cross_platform.permissions');
  const focusedUnitTestsSteps = asArray(focusedUnitTestsJob.steps, 'workflow.jobs.unit_cross_platform.steps');
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
  }).find((step) => typeof step.uses === 'string' && step.uses.startsWith('actions/checkout@'));
  if (checkoutStep == null) {
    throw new Error('CI workflow test job is missing checkout before DOGFOOD i18n policy gate');
  }

  const checkoutWith = asRecord(checkoutStep.with, 'workflow.jobs.test.checkout.with');
  const fetchDepth = Number(checkoutWith['fetch-depth']);
  if (!Number.isFinite(fetchDepth)) {
    throw new Error('CI workflow test job checkout fetch-depth must be numeric');
  }

  const i18nPolicyGate = asRecord(steps[i18nPolicyGateIndex], 'workflow.jobs.test.i18nPolicyGate');
  const focusedPortableStep = focusedUnitTestsSteps.map((step) => {
    return asRecord(step, 'workflow.jobs.unit_cross_platform.steps[]');
  }).find((step) => step.name === 'Focused portable unit tests');
  if (focusedPortableStep == null) {
    throw new Error('CI workflow unit_cross_platform job is missing Focused portable unit tests step');
  }

  return {
    testJob: {
      checkoutUses: asString(checkoutStep.uses, 'workflow.jobs.test.checkout.uses'),
      checkoutFetchDepth: fetchDepth,
      i18nPolicyGateName: asString(i18nPolicyGate.name, 'workflow.jobs.test.i18nPolicyGate.name'),
      i18nPolicyGateRun: asString(i18nPolicyGate.run, 'workflow.jobs.test.i18nPolicyGate.run'),
    },
    focusedUnitTestsJob: {
      permissionsContents: focusedUnitTestsPermissions == null
        ? undefined
        : asString(focusedUnitTestsPermissions.contents, 'workflow.jobs.unit_cross_platform.permissions.contents'),
      focusedPortableRun: asString(focusedPortableStep.run, 'workflow.jobs.unit_cross_platform.focusedPortable.run'),
    },
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${label} must be a mapping`);
  }
  return value;
}

function asArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a sequence`);
  }
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
