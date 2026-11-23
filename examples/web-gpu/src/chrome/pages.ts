/** The showcase's two pages, each opened from the palette or with `Space` then its key. */
export interface ShowcasePage {
  readonly id: 'gpu' | 'dom';
  readonly href: string;
  readonly label: string;
  readonly leader: string;
}

export const PAGES: readonly ShowcasePage[] = [
  { id: 'gpu', href: './', label: 'GPU showcase', leader: 'g' },
  { id: 'dom', href: './dom.html', label: 'DOM check', leader: 'd' },
];

export function openPage(page: ShowcasePage): void {
  window.location.assign(page.href);
}
