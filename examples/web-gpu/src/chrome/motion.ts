import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import type { RefObject } from 'react';

gsap.registerPlugin(useGSAP);

/**
 * The chrome's entrance: one GSAP timeline that brings in every
 * `[data-motion]` card, staggered. The Surface card carries no
 * `data-motion`, so nothing moves the canvas the probes measure. With
 * reduced motion the cards simply appear.
 */
export function useChromeMotion(root: RefObject<HTMLElement | null>): void {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { duration: 0.35, ease: 'power2.out' } })
        .from('[data-motion]', { opacity: 0, y: 12, stagger: 0.06, clearProps: 'opacity,transform' });
    });
    return () => { media.revert(); };
  }, { scope: root });
}
