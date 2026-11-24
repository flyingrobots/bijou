import { useMemo, type MouseEvent } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/vendor/components/ui/alert';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/vendor/components/ui/item';
import { ChromeShell } from '../chrome/chrome-shell.js';
import type { ChromeCommand } from '../chrome/commands.js';
import { KeyHint } from '../chrome/key-hint.js';
import { GALLERY_DEMOS } from './demos.js';
import { navigate, routeHref } from './route.js';

const NO_LEADERS = [] as const;

/** A plain left click moves within the page; a modified click or a middle click keeps the link's own behaviour. */
const follow = (href: string) => (event: MouseEvent): void => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(href);
};

/** The gallery: every registered demo, each a link to its own address. `unknown` is an address that named no demo. */
export function GalleryPage({ unknown, search }: { unknown: string | null; search: string }) {
  const commands = useMemo((): readonly ChromeCommand[] => GALLERY_DEMOS.map((demo) => ({
    id: `demo:${demo.id}`, group: 'Demos', label: demo.title, run: () => { navigate(routeHref(demo.id, search)); },
  })), [search]);
  return (
    <ChromeShell page="gallery" title="Bijou Showcase Gallery" commands={commands} leaders={NO_LEADERS}>
      {unknown !== null && (
        <Alert data-gallery-message="">
          <AlertTitle>No demo with that name</AlertTitle>
          <AlertDescription>There is no demo called {unknown}. Choose one from the list.</AlertDescription>
        </Alert>
      )}
      <ItemGroup role="group" aria-label="Demos" data-gallery="" data-nav-region="demos" className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {GALLERY_DEMOS.map((demo) => (
          <Item key={demo.id} asChild variant="outline" data-nav="" data-gallery-demo={demo.id} onClick={follow(routeHref(demo.id, search))}>
            <a href={routeHref(demo.id, search)}>
              <ItemContent>
                <ItemTitle className="text-xl">{demo.title}</ItemTitle>
                <ItemDescription className="text-base">{demo.description}</ItemDescription>
              </ItemContent>
              <ItemActions><KeyHint keys={['Enter']} /></ItemActions>
            </a>
          </Item>
        ))}
      </ItemGroup>
    </ChromeShell>
  );
}
