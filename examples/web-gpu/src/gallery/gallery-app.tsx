import { useMemo } from 'react';
import { DemoPage } from './demo-page.js';
import { GalleryPage } from './gallery-page.js';
import { parseRoute, useSearch } from './route.js';

/** The address chooses the page: the gallery, or one demo full-window. */
export function GalleryApp() {
  const search = useSearch();
  const route = useMemo(() => parseRoute(search), [search]);
  if (route.kind === 'demo') return <DemoPage key={route.demo.id} demo={route.demo} search={search} />;
  return <GalleryPage unknown={route.unknown} search={search} />;
}
