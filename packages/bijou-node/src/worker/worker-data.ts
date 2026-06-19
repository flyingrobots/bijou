export interface WorkerSerializableOptions {
  altScreen?: boolean;
  hideCursor?: boolean;
  mouse?: boolean;
  css?: string;
}

interface BijouWorkerFlag {
  readonly isBijouWorker: true;
  readonly options?: unknown;
  readonly runtime?: unknown;
}

export interface BijouWorkerData {
  isBijouWorker: true;
  options: WorkerSerializableOptions;
  runtime: {
    columns: number;
    rows: number;
  };
}

export function hasBijouWorkerFlag(value: unknown): value is BijouWorkerFlag {
  return isObjectRecord(value) && value['isBijouWorker'] === true;
}

export function readBijouWorkerData(value: unknown): BijouWorkerData {
  if (!hasBijouWorkerFlag(value)) {
    throw new Error('startWorkerApp requires Bijou worker data');
  }

  const options = value.options;
  const runtime = value.runtime;
  if (!isWorkerSerializableOptions(options) || !isRuntimeViewportData(runtime)) {
    throw new Error('startWorkerApp received malformed Bijou worker data');
  }

  return {
    isBijouWorker: true,
    options,
    runtime,
  };
}

export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isWorkerSerializableOptions(value: unknown): value is WorkerSerializableOptions {
  return isObjectRecord(value)
    && optionalBoolean(value['altScreen'])
    && optionalBoolean(value['hideCursor'])
    && optionalBoolean(value['mouse'])
    && optionalString(value['css']);
}

function isRuntimeViewportData(value: unknown): value is BijouWorkerData['runtime'] {
  return isObjectRecord(value)
    && typeof value['columns'] === 'number'
    && typeof value['rows'] === 'number';
}

function optionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean';
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}
