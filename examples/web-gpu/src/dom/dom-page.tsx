import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/vendor/components/ui/card';
import { ChromeShell } from '../chrome/chrome-shell.js';
import { KeysCard, SHARED_KEYS } from '../chrome/keys-card.js';
import { MountHost } from '../chrome/mount-host.js';
import { mountDomCheck } from './probe.js';

const NO_COMMANDS = [] as const;

/** The page the browser suite checks mountBijouDom() on: the mounted scene beside the keys. */
export function DomPage() {
  return (
    <ChromeShell page="dom" title="Bijou DOM Check" commands={NO_COMMANDS} leaders={NO_COMMANDS}>
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
        <Card data-region="dom" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bijou DOM host</CardTitle>
            <CardDescription>A semantic scene app mounted with mountBijouDom(), for the browser suite. Its elements are the library's own.</CardDescription>
          </CardHeader>
          <CardContent>
            <MountHost id="dom-root" size="dom" label="Bijou DOM host" onHost={mountDomCheck} />
          </CardContent>
        </Card>
        <KeysCard rows={SHARED_KEYS} />
      </div>
    </ChromeShell>
  );
}
