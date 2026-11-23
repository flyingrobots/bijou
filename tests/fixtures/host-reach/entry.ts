// A host import two re-exports deep, and host globals the audit must find.
export * from './barrel.js';
export { shadowed } from './shadow.js';
export { local, ownSelf, resident } from './scoped.js';
export const lazyGlobal = (): Promise<unknown> => import('./global-read.js');
