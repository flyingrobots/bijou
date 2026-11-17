export interface ExecutionOptions {
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
  readonly input?: string | Buffer;
  readonly binary?: boolean;
  readonly maxBytes?: number;
  readonly timeout?: number;
  readonly cleanup?: boolean;
  readonly hostPath?: string;
  readonly allowFailure?: boolean;
  readonly signal?: AbortSignal;
  readonly onData?: (chunk: Buffer) => void;
  readonly onDiagnostic?: (text: string) => void;
  readonly monitor?: () => unknown | Promise<unknown>;
}
export function execute(argv: readonly string[], options?: ExecutionOptions): Promise<{ code: number; output: Buffer }>;
export function freeBytes(path: string): number;
export function requireFree(path: string): number;
export function readInput(): Promise<Buffer>;
export function collectInput(stream: AsyncIterable<Uint8Array>): Promise<Buffer>;
