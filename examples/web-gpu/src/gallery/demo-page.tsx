import { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Alert, AlertDescription, AlertTitle } from '@/vendor/components/ui/alert';
import { Badge } from '@/vendor/components/ui/badge';
import { Button } from '@/vendor/components/ui/button';
import { Spinner } from '@/vendor/components/ui/spinner';
import { THEME_STORAGE_KEY } from '../chrome/chrome-shell.js';
import { KeyHint } from '../chrome/key-hint.js';
import { MountHost } from '../chrome/mount-host.js';
import type { GalleryDemo } from './demos.js';
import { useBackKey } from './back-key.js';
import { openDemo, type OpenDemo } from './open-demo.js';
import { navigate, routeHref } from './route.js';

type Status = { readonly state: 'loading' } | { readonly state: 'ready' } | { readonly state: 'failed'; readonly error: string };

/** One demo with nothing around it but a way back: the Surface is the window. Its code loads when this page opens. */
export function DemoPage({ demo, search }: { demo: GalleryDemo; search: string }) {
  const [status, setStatus] = useState<Status>({ state: 'loading' });
  const running = useRef<OpenDemo | null>(null);
  const back = useCallback(() => { navigate(routeHref(null, search)); }, [search]);
  useBackKey(back);
  const onHost = useCallback((host: HTMLElement) => {
    running.current = openDemo(host, demo.id, search, (error) => { setStatus(error === null ? { state: 'ready' } : { state: 'failed', error }); });
  }, [demo.id, search]);
  // Leaving the page stops the demo, so no canvas, probe or listener stays behind.
  useEffect(() => () => { running.current?.stop(); running.current = null; }, []);
  return (
    <ThemeProvider storageKey={THEME_STORAGE_KEY}>
      <Button variant="secondary" size="lg" className="fixed end-4 top-4 z-10" onClick={back}>
        Back to the gallery <KeyHint keys={['Esc']} />
      </Button>
      {status.state === 'loading' && (
        <Badge variant="secondary" className="fixed start-4 top-4 z-10"><Spinner data-icon="inline-start" />Loading {demo.title}</Badge>
      )}
      {status.state === 'failed' && (
        <Alert variant="destructive" data-demo-error="" className="fixed inset-x-4 top-20 z-10 w-auto">
          <AlertTitle>{demo.title} did not open</AlertTitle>
          <AlertDescription>{status.error}</AlertDescription>
        </Alert>
      )}
      <MountHost id="surface" size="window" label={demo.title} onHost={onHost} />
    </ThemeProvider>
  );
}
