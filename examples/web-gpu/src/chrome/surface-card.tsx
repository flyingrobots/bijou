import { Alert, AlertDescription, AlertTitle } from '@/vendor/components/ui/alert';
import { Badge } from '@/vendor/components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/vendor/components/ui/card';
import { Skeleton } from '@/vendor/components/ui/skeleton';
import { Spinner } from '@/vendor/components/ui/spinner';
import { BACKEND_LABELS } from '../boot.js';
import type { ShowcaseView } from '../showcase-store.js';
import { MountHost } from './mount-host.js';

/** Negotiating while an operation runs, or while a mounted app has not presented its first frame. */
function Status({ view }: { view: ShowcaseView }) {
  const hud = view.hud;
  if (hud === null) return <Skeleton className="h-6 w-32" />;
  // The DOM host presents no frames, so it is never waiting for a first one.
  const waiting = view.busy > 0 || (hud.host !== 'dom' && hud.app !== null && hud.presents === 0 && hud.problem === null);
  if (waiting) return <Badge variant="secondary"><Spinner data-icon="inline-start" />Negotiating</Badge>;
  if (hud.host === 'dom') return <Badge variant="outline" data-status="dom">DOM · native elements</Badge>;
  if (hud.backend === null) return <Badge variant="outline">Nothing mounted</Badge>;
  return <Badge variant="outline">{BACKEND_LABELS[hud.backend]} · {hud.evidenceLevel ?? 'no receipt'}</Badge>;
}

/** The fallback reasons, when `auto` had to skip a backend. */
function Fallback({ view }: { view: ShowcaseView }) {
  const reasons = view.hud?.fallbackReasons ?? [];
  if (reasons.length === 0 || view.hud?.backend == null) return null;
  return (
    <Alert data-fallback="">
      <AlertTitle>Fell back to {BACKEND_LABELS[view.hud.backend]}</AlertTitle>
      {reasons.map((reason) => (
        <AlertDescription key={reason.backend} data-fallback-reason={reason.backend}>
          {BACKEND_LABELS[reason.backend]}: {reason.code} ({reason.reason})
        </AlertDescription>
      ))}
    </Alert>
  );
}

/** The Surface: the container `mountBijouCanvas()` draws in, with the mount's status and any problem. */
export function SurfaceCard({ view, onHost }: { view: ShowcaseView; onHost: (host: HTMLElement) => void }) {
  return (
    <Card data-region="surface" className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Bijou Surface</CardTitle>
        <CardDescription>
          {view.hud?.host === 'dom'
            ? 'The same app, mounted with mountBijouDom() as native elements. Its state came from the canvas host.'
            : "Example apps mounted with mountBijouCanvas() on Geordi's presenters. Click the Surface, then type: every key goes to the app."}
        </CardDescription>
        <CardAction><Status view={view} /></CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <MountHost id="surface" size="surface" label="Bijou Surface" onHost={onHost} />
        <Fallback view={view} />
        <Alert variant="destructive" id="boot-error" hidden={view.error === null}>
          {view.error !== null && <><AlertTitle>Problem</AlertTitle><AlertDescription>{view.error}</AlertDescription></>}
        </Alert>
      </CardContent>
    </Card>
  );
}
