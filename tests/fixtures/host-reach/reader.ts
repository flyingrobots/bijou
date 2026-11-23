import { statSync } from 'node:fs';

export const readSize = (path: string): number => statSync(path).size;
export const residentBytes = (): number => process.memoryUsage().rss;
