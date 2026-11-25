import { useEffect, useMemo } from 'react';
import { DemoPage } from './demo-page.js';
import { GalleryPage } from './gallery-page.js';
import { parseRoute, redirect, retiredHref, useSearch } from './route.js';

/** The address chooses the page: the gallery, or one demo full-window. A retired address becomes the gallery's. */
export function GalleryApp() {
  const asked = useSearch();
  const retired = useMemo(() => retiredHref(asked), [asked]);
  useEffect(() => { if (retired !== null) redirect(retired); }, [retired]);
  const search = retired ?? asked;
  const route = useMemo(() => parseRoute(search), [search]);
  if (route.kind === 'demo') return <DemoPage key={route.demo.id} demo={route.demo} search={search} />;
  return <GalleryPage unknown={route.unknown} search={search} />;
}
