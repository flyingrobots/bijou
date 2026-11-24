import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { bootShowcase } from '../boot.js';
import type { ShowcaseStore } from '../showcase-store.js';
import { ChromeShell } from './chrome-shell.js';
import { showcaseCommands, toggleHost } from './commands.js';
import { ControlsCard } from './controls-card.js';
import { HudCard } from './hud-card.js';
import { KeysCard, SHARED_KEYS } from './keys-card.js';
import { RefusedCard } from './refused-card.js';
import { SurfaceCard } from './surface-card.js';

const focusSurface = (): void => { document.querySelector<HTMLElement>('#surface textarea')?.focus(); };
const KEYS = [{ label: 'Focus the Surface', keys: [['Space', 's']] }, { label: 'Switch host: canvas or DOM', keys: [['Space', 'm']] }, ...SHARED_KEYS];

/** The GPU showcase: the Surface across most of the width, the controls and the HUD beside it. */
export function ShowcasePage({ store }: { store: ShowcaseStore }) {
  const view = useSyncExternalStore(store.subscribe, store.snapshot);
  const commands = useMemo(() => showcaseCommands(store), [store]);
  const leaders = useMemo(() => [
    { key: 's', label: 'Focus the Surface', run: focusSurface },
    { key: 'm', label: 'Switch host', run: () => { toggleHost(store); } },
  ], [store]);
  const onHost = useCallback((host: HTMLElement) => { bootShowcase(host, store); }, [store]);
  return (
    <ChromeShell page="gpu" title="Bijou GPU Showcase" commands={commands} leaders={leaders}>
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3 2xl:grid-cols-4">
        <SurfaceCard view={view} onHost={onHost} />
        <div className="flex flex-col gap-6">
          <ControlsCard view={view} store={store} />
          <RefusedCard />
        </div>
        <div className="flex flex-col gap-6 lg:col-span-3 2xl:col-span-1">
          <HudCard view={view} />
          <KeysCard rows={KEYS} />
        </div>
      </div>
    </ChromeShell>
  );
}
