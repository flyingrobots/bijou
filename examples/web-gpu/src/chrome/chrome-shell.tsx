import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ThemeProvider, useTheme } from '@/components/theme-provider';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/vendor/components/ui/badge';
import { Button } from '@/vendor/components/ui/button';
import { TooltipProvider } from '@/vendor/components/ui/tooltip';
import { pageCommands, type ChromeCommand } from './commands.js';
import { KeyHint } from './key-hint.js';
import { usePageKeys, type LeaderKey } from './keys.js';
import { useChromeMotion } from './motion.js';
import { openPage, PAGES, type ShowcasePage } from './pages.js';
import { Palette } from './palette.js';

const THEME_STORAGE_KEY = 'bijou-web-gpu-theme';

interface ShellProps {
  readonly page: ShowcasePage['id'];
  readonly title: string;
  /** Commands of this page, listed in the palette before the pages and themes. */
  readonly commands: readonly ChromeCommand[];
  /** More `Space` leaders, such as `s` to focus the Surface. */
  readonly leaders: readonly LeaderKey[];
  readonly children: ReactNode;
}

function Shell({ page, title, commands, leaders, children }: ShellProps) {
  const { setTheme } = useTheme();
  const [palette, setPalette] = useState(false);
  const [themeMenu, setThemeMenu] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useChromeMotion(root);
  const all = useMemo(() => [...commands, ...pageCommands(setTheme)], [commands, setTheme]);
  const { leader } = usePageKeys(() => { setPalette(true); }, [
    ...leaders,
    ...PAGES.map((entry) => ({ key: entry.leader, label: entry.label, run: () => { openPage(entry); } })),
    { key: 't', label: 'Theme', run: () => { setThemeMenu(true); } },
  ]);
  return (
    <div ref={root} className="flex min-h-svh w-full flex-col gap-6 p-4 md:p-6 2xl:p-10">
      <div data-nav-region="header" className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {leader && <Badge variant="secondary" aria-live="polite"><KeyHint keys={['Space']} /> then a key</Badge>}
        <div className="ms-auto flex flex-wrap items-center gap-2">
          {PAGES.map((entry) => (
            <Button key={entry.id} asChild size="lg" variant={entry.id === page ? 'secondary' : 'ghost'} data-nav="">
              <a href={entry.href}>{entry.label} <KeyHint keys={['Space', entry.leader]} /></a>
            </Button>
          ))}
          <Button size="lg" variant="outline" data-nav="" onClick={() => { setPalette(true); }}>
            Commands <KeyHint keys={['Esc']} />
          </Button>
          <ThemeSwitch open={themeMenu} onOpenChange={setThemeMenu} keys={['Space', 't']} data-nav="" />
        </div>
      </div>
      {children}
      <Palette open={palette} onOpenChange={setPalette} commands={all} />
    </div>
  );
}

/** The page chrome both showcase pages share: theme, header, keys and command palette. */
export function ChromeShell(props: ShellProps) {
  return (
    <ThemeProvider storageKey={THEME_STORAGE_KEY}>
      <TooltipProvider>
        <Shell {...props} />
      </TooltipProvider>
    </ThemeProvider>
  );
}
