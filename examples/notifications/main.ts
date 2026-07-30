import { pathToFileURL } from 'node:url';
import { run } from '../../packages/bijou-tui/src/index.js';
import { app } from './notification-demo-entry.js';

export { createNotificationDemoApp } from './notification-demo-create.js';
export { app } from './notification-demo-entry.js';
export { ctx } from './notification-demo-options.js';

if (
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void run(app, { mouse: true });
}
