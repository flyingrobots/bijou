import { run } from '@flyingrobots/bijou-tui';
import { ctx } from '../_shared/setup.ts';
import { createCanonicalWorkbenchApp } from '../_shared/canonical-app.ts';

run(createCanonicalWorkbenchApp(ctx));
