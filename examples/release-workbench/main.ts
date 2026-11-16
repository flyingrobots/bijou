import { run } from '@flyingrobots/bijou-tui';
import { ctx } from '../_shared/setup.js';
import { createCanonicalWorkbenchApp } from '../_shared/canonical-app.js';

void run(createCanonicalWorkbenchApp(ctx));
