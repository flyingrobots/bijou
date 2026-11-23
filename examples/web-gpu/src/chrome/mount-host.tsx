import { useCallback, useRef } from 'react';

/** Sizes a mount host may take; layout only, so the library's elements inside it keep their own styles. */
export type MountHostSize = 'surface' | 'dom';

const SIZES: Record<MountHostSize, string> = {
  // The canvas fills its container's content box, so the host's height sets the Surface's rows.
  surface: 'relative h-96 w-full lg:h-144',
  dom: 'relative w-full',
};

/**
 * The element a Bijou mount owns. React renders it empty and never renders
 * into it: `mountBijouCanvas()` or `mountBijouDom()` adds the library's
 * elements, and `[data-bijou-mount] *` in index.css keeps chrome styles out.
 * Page keys also skip focus inside it (see keys.ts). `onHost` runs once.
 */
export function MountHost({ id, size, label, onHost }: { id: string; size: MountHostSize; label: string; onHost: (host: HTMLElement) => void }) {
  const started = useRef(false);
  const attach = useCallback((host: HTMLDivElement | null) => {
    if (host === null || started.current) return;
    started.current = true;
    onHost(host);
  }, [onHost]);
  return <div id={id} data-bijou-mount="" aria-label={label} role="region" className={SIZES[size]} ref={attach} />;
}
