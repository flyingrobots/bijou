import type { BijouContext } from '@flyingrobots/bijou';
import {
  accordion,
  alert,
  box,
  boxSurface,
  brailleChartSurface,
  breadcrumb,
  createSurface,
  dag,
  enumeratedList,
  explainability,
  gradientText,
  headerBox,
  hyperlink,
  inspector,
  kbd,
  loadRandomLogo,
  log,
  markdown,
  paginator,
  perfOverlaySurface,
  progressBar,
  renderByMode,
  separator,
  separatorSurface,
  skeleton,
  sparkline,
  spinnerFrame,
  statsPanelSurface,
  stepper,
  table,
  tabs,
  timeline,
  tree,
  type Surface,
} from '@flyingrobots/bijou';
import {
  canvas,
  compositeSurface,
  browsableListSurface,
  cpFilter,
  createKeyMap,
  createAccordionState,
  createBrowsableListState,
  createCommandPaletteState,
  createNavigableTableState,
  createNotificationState,
  createSplitPaneState,
  dismissNotification,
  filePickerSurface,
  gridSurface,
  helpShort,
  helpShortSurface,
  helpView,
  helpViewSurface,
  interactiveAccordion,
  modal,
  navigableTableSurface,
  pushNotification,
  renderNotificationHistory,
  renderNotificationHistorySurface,
  renderNotificationStack,
  splitPaneSurface,
  statusBarSurface,
  tickNotifications,
  toast,
  viewportSurface,
  commandPaletteSurface,
} from '@flyingrobots/bijou-tui';
import {
  badgeSurface,
  column,
  contentSurface,
  line,
  row,
  screenSurface,
  spacer,
  textSurface,
} from '../_shared/example-surfaces.js';
import {
  CANONICAL_STORY_PROFILE_PRESETS,
  type ComponentStory,
} from '../_stories/protocol.js';

export interface DogfoodComponentStory<State = void> extends ComponentStory<State> {
  readonly coverageFamilyIds: readonly string[];
}

function modalBackdrop(width: number, ctx: BijouContext): Surface {
  const innerWidth = Math.max(28, width - 4);
  const content = textSurface([
    'Release queue',
    '',
    '  web',
    '  api',
    '  workers',
    '',
    `  ${kbd('d', { ctx })} deploy  ${kbd('?', { ctx })} help  ${kbd('q', { ctx })} quit`,
  ].join('\n'), Math.max(1, innerWidth - 2), 12);
  const fullHeightPanel = boxSurface(content, {
    title: 'release-workbench',
    width: innerWidth,
    ctx,
  });
  return screenSurface(width, 14, fullHeightPanel);
}

function toastBackdrop(width: number, height: number, ctx: BijouContext): Surface {
  const panel = boxSurface(column([
    row(['release queue  ', badgeSurface('LIVE', 'success', ctx)]),
    spacer(),
    line('Canaries stable in eu-west'),
    line('Promotion window opens in 4m'),
  ]), {
    title: 'release dashboard',
    width: Math.max(28, width - 4),
    ctx,
  });
  return screenSurface(width, height, panel, 1, 1);
}

function viewportPreviewSurface(
  width: number,
  content: string | Surface,
  scrollY: number,
  ctx: BijouContext,
): Surface {
  const viewportWidth = Math.max(24, width);
  const header = separatorSurface({ label: 'viewport mask', width: viewportWidth, ctx });
  const body = viewportSurface({
    width: viewportWidth,
    height: 9,
    content,
    scrollY,
    showScrollbar: true,
  });
  return column([
    header,
    body,
    line(`  scrollY=${scrollY}  width=${viewportWidth}`, viewportWidth),
  ]);
}

const LONG_DOCUMENT = [
  'Build plan',
  '',
  '1. Resolve dependencies',
  '2. Run migrations',
  '3. Bake artifacts',
  '4. Roll canaries',
  '5. Promote release',
  '',
  'Each stage emits its own frame and can be replayed later.',
  '',
  'The viewport story is intentionally width-sensitive so the docs app can',
  'prove clipping, masking, and scroll-state behavior without a separate demo.',
].join('\n');

const MARKDOWN_RELEASE_NOTES = [
  '# Release note',
  '',
  '**Bijou** keeps docs, shell, and examples inside the same runtime.',
  '',
  '## This slice',
  '',
  '- documents bounded prose honestly',
  '- keeps links explicit instead of vague',
  '- avoids turning markdown into layout chrome',
  '',
  '> Move to pager patterns if the content becomes a document-reading task.',
].join('\n');

function loopingProgressPercent(timeMs: number, offsetMs = 0, cycleMs = 2_800): number {
  const normalized = (((timeMs + offsetMs) % cycleMs) + cycleMs) % cycleMs;
  const phase = normalized / cycleMs;
  const pingPong = phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
  return Math.round(pingPong * 100);
}

function infoText(ctx: BijouContext, text: string): string {
  return ctx.theme.noColor ? text : ctx.style.styled(ctx.semantic('info'), text);
}

function mutedText(ctx: BijouContext, text: string): string {
  return ctx.theme.noColor ? text : ctx.style.styled(ctx.semantic('muted'), text);
}

function successText(ctx: BijouContext, text: string): string {
  return ctx.theme.noColor ? text : ctx.style.styled(ctx.status('success'), text);
}

function warningText(ctx: BijouContext, text: string): string {
  return ctx.theme.noColor ? text : ctx.style.styled(ctx.status('warning'), text);
}

function confirmPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly question: string;
  readonly defaultValue?: boolean;
  readonly yesMeaning: string;
  readonly noMeaning: string;
}): string | Surface {
  const {
    width,
    ctx,
    question,
    defaultValue = true,
    yesMeaning,
    noMeaning,
  } = input;
  const hint = defaultValue ? '[Y/n]' : '[y/N]';
  const defaultLabel = defaultValue ? 'Yes' : 'No';

  if (ctx.mode === 'pipe') {
    return [
      `${question} ${defaultValue ? 'Y/n' : 'y/N'}?`,
      `Yes: ${yesMeaning}`,
      `No: ${noMeaning}`,
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    return [
      question,
      `Type yes or no (default: ${defaultValue ? 'yes' : 'no'}).`,
      `Yes: ${yesMeaning}`,
      `No: ${noMeaning}`,
    ].join('\n');
  }

  const panelWidth = Math.max(38, Math.min(width, 54));
  return boxSurface(contentSurface([
    `${infoText(ctx, '?')} ${question} ${mutedText(ctx, hint)}`,
    '',
    `Default: ${defaultValue ? successText(ctx, defaultLabel) : warningText(ctx, defaultLabel)}`,
    `Yes: ${yesMeaning}`,
    `No: ${noMeaning}`,
    '',
    mutedText(ctx, 'Enter accepts the default.'),
  ].join('\n')), {
    title: 'binary decision',
    width: panelWidth,
    ctx,
  });
}

interface MultiselectPreviewOption {
  readonly label: string;
  readonly description?: string;
}

interface SingleChoicePreviewOption {
  readonly label: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
}

function multiselectPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly options: readonly MultiselectPreviewOption[];
  readonly selectedIndices: readonly number[];
  readonly focusedIndex?: number;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    options,
    selectedIndices,
    focusedIndex = 0,
  } = input;
  const selectedSet = new Set(selectedIndices);
  const selectedLabels = options
    .filter((_, index) => selectedSet.has(index))
    .map((option) => option.label);

  if (ctx.mode === 'pipe') {
    return [
      title,
      '',
      ...options.map((option, index) => `${index + 1}. ${option.label}`),
      '',
      `Enter numbers (comma-separated): ${selectedIndices.map((index) => index + 1).join(', ')}`,
      `Selected: ${selectedLabels.join(', ')}`,
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    return [
      title,
      '',
      ...options.map((option, index) => {
        const state = selectedSet.has(index) ? 'selected' : 'not selected';
        return `${index + 1}. ${option.label} (${state})${option.description ? ` — ${option.description}` : ''}`;
      }),
      '',
      'Enter numbers separated by commas to choose a set.',
      `Current set: ${selectedLabels.join(', ')}`,
    ].join('\n');
  }

  const lines = [
    `${infoText(ctx, '?')} ${title}`,
    '',
    ...options.map((option, index) => {
      const pointer = index === focusedIndex ? infoText(ctx, '\u276f') : ' ';
      const mark = selectedSet.has(index) ? successText(ctx, '\u25c9') : mutedText(ctx, '\u25cb');
      const description = option.description ? mutedText(ctx, ` \u2014 ${option.description}`) : '';
      return `${pointer} ${mark} ${option.label}${description}`;
    }),
    '',
    mutedText(ctx, '(space to toggle, enter to confirm)'),
  ];

  return boxSurface(contentSurface(lines.join('\n')), {
    title: 'multiple choice',
    width: Math.max(40, Math.min(width, 58)),
    ctx,
  });
}

function selectPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly options: readonly SingleChoicePreviewOption[];
  readonly selectedIndex: number;
  readonly focusedIndex?: number;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    options,
    selectedIndex,
    focusedIndex = selectedIndex,
  } = input;
  const selected = options[selectedIndex] ?? options[0];

  if (ctx.mode === 'pipe') {
    return [
      title,
      '',
      ...options.map((option, index) => `${index + 1}. ${option.label}`),
      '',
      `> ${selectedIndex + 1}`,
      `Selected: ${selected?.label ?? ''}`,
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    return [
      title,
      '',
      ...options.map((option, index) => {
        const state = index === selectedIndex ? 'selected' : 'not selected';
        return `${index + 1}. ${option.label} (${state})${option.description ? ` — ${option.description}` : ''}`;
      }),
      '',
      `Current choice: ${selected?.label ?? ''}`,
      'Enter a number to choose one option.',
    ].join('\n');
  }

  const lines = [
    `${infoText(ctx, '?')} ${title}`,
    '',
    ...options.map((option, index) => {
      const pointer = index === focusedIndex ? infoText(ctx, '\u276f') : ' ';
      const mark = index === selectedIndex ? successText(ctx, '\u25c9') : mutedText(ctx, '\u25cb');
      const description = option.description ? mutedText(ctx, ` \u2014 ${option.description}`) : '';
      return `${pointer} ${mark} ${option.label}${description}`;
    }),
    '',
    mutedText(ctx, '(↑/↓ browse, enter to confirm)'),
  ];

  return box(lines.join('\n'), {
    title: 'single choice',
    width: Math.max(42, Math.min(width, 60)),
    ctx,
  });
}

function filterPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly query: string;
  readonly options: readonly SingleChoicePreviewOption[];
  readonly matchedIndices: readonly number[];
  readonly selectedIndex: number;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    query,
    options,
    matchedIndices,
    selectedIndex,
  } = input;
  const selected = options[selectedIndex] ?? options[0];
  const matchedOptions = matchedIndices.map((index) => options[index]).filter(Boolean) as SingleChoicePreviewOption[];

  if (ctx.mode === 'pipe') {
    return [
      title,
      '',
      ...matchedOptions.map((option, index) => `${index + 1}. ${option.label}`),
      '',
      `Enter number or search: ${query}`,
      `Matched: ${selected?.label ?? ''}`,
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    return [
      title,
      '',
      `Search query: ${query}`,
      ...matchedOptions.map((option, index) => {
        const state = matchedIndices[index] === selectedIndex ? 'selected match' : 'match';
        const keywords = option.keywords?.length ? ` — keywords: ${option.keywords.join(', ')}` : '';
        return `${index + 1}. ${option.label} (${state})${option.description ? ` — ${option.description}` : ''}${keywords}`;
      }),
      '',
      `Current match: ${selected?.label ?? ''}`,
      'Type or enter a number to choose one option.',
    ].join('\n');
  }

  const lines = [
    `${infoText(ctx, '?')} ${title}`,
    `${mutedText(ctx, 'Search:')} ${query}`,
    '',
    ...matchedOptions.map((option, index) => {
      const globalIndex = matchedIndices[index]!;
      const pointer = globalIndex === selectedIndex ? infoText(ctx, '\u276f') : ' ';
      const mark = globalIndex === selectedIndex ? successText(ctx, '\u25c9') : mutedText(ctx, '\u25cb');
      const description = option.description ? mutedText(ctx, ` \u2014 ${option.description}`) : '';
      return `${pointer} ${mark} ${option.label}${description}`;
    }),
    '',
    mutedText(ctx, '(type to narrow, enter to confirm)'),
  ];

  return box(lines.join('\n'), {
    title: 'filterable single choice',
    width: Math.max(44, Math.min(width, 64)),
    ctx,
  });
}

function textEntryPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly label: string;
  readonly value: string;
  readonly helperText?: string;
  readonly validationText?: string;
  readonly multiline?: boolean;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    label,
    value,
    helperText,
    validationText,
    multiline = false,
  } = input;

  if (ctx.mode === 'pipe') {
    return [
      title,
      '',
      `${label}:`,
      value,
      ...(helperText ? ['', `Help: ${helperText}`] : []),
      ...(validationText ? [`Validation: ${validationText}`] : []),
    ].join('\n');
  }

  if (ctx.mode === 'accessible') {
    return [
      title,
      '',
      `Field: ${label}`,
      `Input type: ${multiline ? 'multiline text' : 'single-line text'}`,
      `Current value: ${value.replace(/\n/g, ' / ')}`,
      ...(helperText ? [`Help: ${helperText}`] : []),
      ...(validationText ? [`Validation: ${validationText}`] : []),
    ].join('\n');
  }

  return boxSurface(contentSurface([
    `${infoText(ctx, '?')} ${title}`,
    '',
    mutedText(ctx, label),
    value,
    ...(helperText ? ['', mutedText(ctx, helperText)] : []),
    ...(validationText ? [mutedText(ctx, validationText)] : []),
  ].join('\n')), {
    title: multiline ? 'multiline entry' : 'text entry',
    width: Math.max(42, Math.min(width, multiline ? 62 : 54)),
    ctx,
  });
}

function stagedFormPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'group' | 'wizard';
  readonly stepLabel?: string;
  readonly fields: readonly { readonly label: string; readonly value: string }[];
  readonly summaryText: string;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
    stepLabel,
    fields,
    summaryText,
  } = input;

  if (ctx.mode === 'pipe') {
    return [
      title,
      ...(stepLabel ? ['', stepLabel] : []),
      '',
      ...fields.flatMap((field) => [`${field.label}:`, field.value, '']),
      `Summary: ${summaryText}`,
    ].join('\n').trimEnd();
  }

  if (ctx.mode === 'accessible') {
    return [
      title,
      ...(stepLabel ? [`Current step: ${stepLabel}`] : []),
      '',
      ...fields.map((field) => `${field.label}: ${field.value}`),
      '',
      `Summary: ${summaryText}`,
    ].join('\n');
  }

  const panelWidth = Math.max(46, Math.min(width, 64));
  const innerWidth = Math.max(24, panelWidth - 2);
  return boxSurface(column([
    ...(stepLabel ? [separatorSurface({ label: stepLabel, width: innerWidth, ctx }), spacer()] : []),
    ...fields.flatMap((field, index) => ([
      line(mutedText(ctx, field.label), innerWidth),
      contentSurface(field.value),
      ...(index < fields.length - 1 ? [spacer()] : []),
    ])),
    spacer(),
    line(mutedText(ctx, summaryText), innerWidth),
  ]), {
    title: mode === 'wizard' ? 'staged form' : 'form group',
    width: panelWidth,
    ctx,
  });
}

function dividerPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly sections: readonly {
    readonly label?: string;
    readonly lines: readonly string[];
  }[];
}): string | Surface {
  const {
    width,
    ctx,
    title,
    sections,
  } = input;

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    const separatorWidth = Math.max(24, Math.min(width, 58));
    const lines = [title, ''];

    sections.forEach((section, index) => {
      if (index > 0) {
        lines.push(separator({ label: section.label, width: separatorWidth, ctx }));
      }
      lines.push(...section.lines);
      if (index < sections.length - 1) {
        lines.push('');
      }
    });

    return lines.join('\n');
  }

  const panelWidth = Math.max(46, Math.min(width, 62));
  const innerWidth = Math.max(24, panelWidth - 2);
  const nodes: Surface[] = [];

  sections.forEach((section, index) => {
    if (index > 0) {
      nodes.push(separatorSurface({ label: section.label, width: innerWidth, ctx }));
      nodes.push(spacer());
    }
    section.lines.forEach((entry) => {
      nodes.push(line(entry, innerWidth));
    });
    if (index < sections.length - 1) {
      nodes.push(spacer());
    }
  });

  return boxSurface(column(nodes), {
    title,
    width: panelWidth,
    ctx,
  });
}

const HELP_PREVIEW_KEYS = createKeyMap<{ readonly type: string }>()
  .group('Navigation', (g) => g
    .bind('j', 'Move down', { type: 'down' })
    .bind('k', 'Move up', { type: 'up' })
    .bind('tab', 'Next pane', { type: 'next-pane' })
  )
  .group('Actions', (g) => g
    .bind('enter', 'Open selection', { type: 'open' })
    .bind('/', 'Search components', { type: 'search' })
    .bind('f2', 'Open settings', { type: 'settings' })
  )
  .group('Shell', (g) => g
    .bind('?', 'Open help', { type: 'help' })
    .bind('q', 'Quit', { type: 'quit' })
  );

function helpPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'hint' | 'reference';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const panelWidth = Math.max(42, Math.min(width, 62));
  const innerWidth = Math.max(20, panelWidth - 2);

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    if (mode === 'hint') {
      return [
        title,
        '',
        helpShort(HELP_PREVIEW_KEYS),
      ].join('\n');
    }

    return [
      title,
      '',
      helpView(HELP_PREVIEW_KEYS, { title: 'Keyboard shortcuts' }),
    ].join('\n');
  }

  if (mode === 'hint') {
    return boxSurface(column([
      line('Shell footer hint', innerWidth),
      spacer(),
      helpShortSurface(HELP_PREVIEW_KEYS, { width: innerWidth }),
    ]), {
      title,
      width: panelWidth,
      ctx,
    });
  }

  return boxSurface(helpViewSurface(HELP_PREVIEW_KEYS, {
    title: 'Keyboard shortcuts',
    width: innerWidth,
  }), {
    title,
    width: panelWidth,
    ctx,
  });
}

function createLiveNotificationState(nowMs: number) {
  let state = createNotificationState<string>();
  state = pushNotification(state, {
    title: 'Canary ready',
    message: 'eu-west has stayed green for 15 minutes.',
    variant: 'ACTIONABLE',
    tone: 'SUCCESS',
    placement: 'UPPER_RIGHT',
    action: { label: 'Promote rollout', payload: 'promote' },
  }, nowMs);
  state = pushNotification(state, {
    title: 'Queue drift detected',
    message: 'Retry backlog is trending upward in the worker pool.',
    variant: 'TOAST',
    tone: 'WARNING',
    placement: 'LOWER_RIGHT',
  }, nowMs + 20);
  return tickNotifications(state, nowMs + 500);
}

function createArchivedNotificationState(nowMs: number) {
  let state = createNotificationState<string>();
  state = pushNotification(state, {
    title: 'Deploy blocked',
    message: 'The runtime failed to boot the latest candidate.',
    variant: 'ACTIONABLE',
    tone: 'ERROR',
    placement: 'UPPER_RIGHT',
    action: { label: 'Retry deploy', payload: 'retry' },
  }, nowMs);
  state = pushNotification(state, {
    title: 'Background sync ready',
    message: 'Fresh reference data is available for review.',
    variant: 'INLINE',
    tone: 'INFO',
    placement: 'LOWER_RIGHT',
  }, nowMs + 20);
  state = tickNotifications(state, nowMs + 500);
  state = dismissNotification(state, 1, nowMs + 900);
  state = dismissNotification(state, 2, nowMs + 920);
  return tickNotifications(state, nowMs + 1_400);
}

function notificationPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'stack' | 'history';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const nowMs = 1_710_000_000_000;

  if (mode === 'history') {
    const historyState = createArchivedNotificationState(nowMs);
    if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
      return [
        title,
        '',
        renderNotificationHistory(historyState, {
          width: Math.max(32, Math.min(width, 56)),
          height: 10,
          filter: 'ALL',
          ctx,
        }),
      ].join('\n');
    }

    return boxSurface(renderNotificationHistorySurface(historyState, {
      width: Math.max(32, Math.min(width, 56)),
      height: 10,
      filter: 'ALL',
      ctx,
    }), {
      title,
      width: Math.max(36, Math.min(width, 60)),
      ctx,
    });
  }

  const liveState = createLiveNotificationState(nowMs);
  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      '[SUCCESS] Canary ready',
      'Action: Promote rollout',
      '',
      '[WARNING] Queue drift detected',
      'Retry backlog is trending upward in the worker pool.',
    ].join('\n');
  }

  const screenWidth = Math.max(48, Math.min(width, 64));
  const screenHeight = 14;
  const background = screenSurface(
    screenWidth,
    screenHeight,
    boxSurface(column([
      row(['release dashboard  ', badgeSurface('LIVE', 'success', ctx)]),
      spacer(),
      line('Window opens in 4m', screenWidth - 6),
      line(mutedText(ctx, 'The notification system owns transient events and archived review.'), screenWidth - 6),
    ]), {
      title,
      width: Math.max(32, screenWidth - 4),
      ctx,
    }),
    1,
    2,
  );

  return compositeSurface(background, renderNotificationStack(liveState, {
    screenWidth,
    screenHeight,
    ctx,
    margin: 1,
  }));
}

function transientAppNotificationPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'actionable' | 'mixed';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const nowMs = 1_710_000_001_000;

  let state = createNotificationState<string>();
  state = pushNotification(state, {
    title: 'Deploy approval ready',
    message: 'The canary stayed green for 20 minutes.',
    variant: mode === 'actionable' ? 'ACTIONABLE' : 'INLINE',
    tone: 'SUCCESS',
    placement: 'UPPER_RIGHT',
    action: { label: 'Promote rollout', payload: 'promote' },
  }, nowMs);
  state = pushNotification(state, {
    title: mode === 'actionable' ? 'Queue drift detected' : 'Release notes synced',
    message: mode === 'actionable'
      ? 'Rollback remains available if latency climbs again.'
      : 'Support docs now match the promoted build.',
    variant: 'TOAST',
    tone: mode === 'actionable' ? 'WARNING' : 'INFO',
    placement: 'LOWER_RIGHT',
  }, nowMs + 40);
  state = tickNotifications(state, nowMs + 500);

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      '[SUCCESS] Deploy approval ready',
      'Action: Promote rollout',
      '',
      mode === 'actionable'
        ? '[WARNING] Queue drift detected'
        : '[INFO] Release notes synced',
    ].join('\n');
  }

  const screenWidth = Math.max(48, Math.min(width, 64));
  const screenHeight = 13;
  const background = screenSurface(
    screenWidth,
    screenHeight,
    boxSurface(column([
      row(['release coordinator  ', badgeSurface(mode === 'actionable' ? 'READY' : 'SYNCED', 'info', ctx)]),
      spacer(),
      line('App-owned notifications can stack by tone and placement.', screenWidth - 6),
      line(mutedText(ctx, 'This family is about transient app events, not archived review history.'), screenWidth - 6),
    ]), {
      title,
      width: Math.max(34, screenWidth - 4),
      ctx,
    }),
    1,
    2,
  );

  return compositeSurface(background, renderNotificationStack(state, {
    screenWidth,
    screenHeight,
    ctx,
    margin: 1,
  }));
}

function progressiveDisclosurePreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly interactive: boolean;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    interactive,
  } = input;

  const sections = [
    {
      title: 'Build',
      content: 'Compile assets, freeze versions, and stamp the candidate build.',
      expanded: true,
    },
    {
      title: 'Review',
      content: 'Surface release notes, migration risks, and owner acknowledgements.',
      expanded: interactive,
    },
    {
      title: 'Promote',
      content: 'Roll canary traffic upward only after the review section is cleared.',
      expanded: false,
    },
  ];

  const body = interactive
    ? interactiveAccordion(createAccordionState(sections), { ctx })
    : accordion(sections, { ctx });

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      body,
    ].join('\n');
  }

  const panelWidth = Math.max(44, Math.min(width, 62));
  return boxSurface(contentSurface(body), {
    title,
    width: panelWidth,
    ctx,
  });
}

function pathAndProgressPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'wayfinding' | 'rollout';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  const text = mode === 'wayfinding'
    ? [
        breadcrumb(['Workspace', 'Docs', 'Families', 'Progress indicators'], { ctx }),
        '',
        paginator({ current: 2, total: 7, style: 'text', ctx }),
      ].join('\n')
    : [
        stepper([
          { label: 'Build' },
          { label: 'Review' },
          { label: 'Canary' },
          { label: 'Promote' },
        ], { current: 2, ctx }),
        '',
        breadcrumb(['Release', 'Canary', 'eu-west'], { ctx }),
      ].join('\n');

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      text,
    ].join('\n');
  }

  return boxSurface(contentSurface(text), {
    title,
    width: Math.max(44, Math.min(width, 62)),
    ctx,
  });
}

function brandingPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'launch' | 'heading';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const stops = ctx.theme.theme.gradient.brand;
  const logo = loadRandomLogo('logos', 'bijou', 'small', undefined, {
    ctx,
    fallbackText: 'BIJOU',
  }).text;
  const heading = gradientText(
    mode === 'launch' ? 'Documentation you can ship' : 'Release ready',
    stops,
    { style: ctx.style, noColor: ctx.theme.noColor },
  );

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      logo,
      '',
      mode === 'launch' ? 'Documentation you can ship' : 'Release ready',
    ].join('\n');
  }

  return boxSurface(column([
    contentSurface(logo),
    spacer(),
    line(heading, Math.max(22, width - 8)),
    ...(mode === 'launch'
      ? [line(mutedText(ctx, 'Brand moments should open the experience, then get out of the way.'), Math.max(22, width - 8))]
      : [line(mutedText(ctx, 'Expressive emphasis should remain rare and clearly non-critical.'), Math.max(22, width - 8))]),
  ]), {
    title,
    width: Math.max(42, Math.min(width, 62)),
    ctx,
  });
}

function customSpark(label: string, value: string, ctx: BijouContext): string {
  return renderByMode(ctx.mode, {
    pipe: () => `[${label.toUpperCase()}] ${value}`,
    accessible: () => `${label}: ${value}.`,
    interactive: () => {
      const icon = ctx.style.styled(ctx.semantic('accent'), '✦');
      const labelText = ctx.style.bold(label);
      const valueText = ctx.style.styled(ctx.semantic('muted'), value);
      return `${icon} ${labelText}: ${valueText}`;
    },
  }, undefined);
}

function customPrimitivePreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
}): string | Surface {
  const {
    width,
    ctx,
    title,
  } = input;
  const preview = [
    customSpark('Deploy', 'v5.2.1 rolling', ctx),
    customSpark('Docs', 'coverage floor met', ctx),
  ].join('\n');

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      preview,
    ].join('\n');
  }

  return boxSurface(contentSurface(preview), {
    title,
    width: Math.max(40, Math.min(width, 56)),
    ctx,
  });
}

function denseComparisonPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'passive' | 'navigable';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;
  const columns = [
    { header: 'Service', width: 16 },
    { header: 'Region', width: 12 },
    { header: 'p95', width: 8 },
    { header: 'Error', width: 8 },
  ];
  const rows = [
    ['api', 'us-east', '84ms', '0.1%'],
    ['queue', 'eu-west', '121ms', '0.4%'],
    ['worker', 'ap-south', '142ms', '0.7%'],
    ['docs', 'us-west', '77ms', '0.0%'],
  ];

  if (mode === 'passive') {
    const preview = table({ columns, rows, ctx });
    if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
      return [title, '', preview].join('\n');
    }
    return boxSurface(contentSurface(preview), {
      title,
      width: Math.max(46, Math.min(width, 64)),
      ctx,
    });
  }

  const state = createNavigableTableState({ columns, rows, height: 3 });
  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      table({ columns, rows: rows.slice(0, 3), ctx }),
    ].join('\n');
  }

  return boxSurface(navigableTableSurface(state, { ctx }), {
    title,
    width: Math.max(46, Math.min(width, 64)),
    ctx,
  });
}

function hierarchyPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'tree' | 'picker';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  if (mode === 'tree') {
    const preview = tree([
      { label: 'src', children: [
        { label: 'components', children: [{ label: 'box.ts' }, { label: 'table.ts' }] },
        { label: 'stories', children: [{ label: 'stories.ts' }] },
      ]},
      { label: 'docs', children: [{ label: 'design-system' }, { label: 'legends' }] },
      { label: 'package.json' },
    ], { ctx });

    if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
      return [title, '', preview].join('\n');
    }

    return boxSurface(contentSurface(preview), {
      title,
      width: Math.max(42, Math.min(width, 58)),
      ctx,
    });
  }

  const pickerState = {
    cwd: '/workspace/bijou',
    entries: [
      { name: 'docs', isDirectory: true },
      { name: 'examples', isDirectory: true },
      { name: 'packages', isDirectory: true },
      { name: 'README.md', isDirectory: false },
      { name: 'package.json', isDirectory: false },
    ],
    focusIndex: 2,
    scrollY: 0,
    height: 5,
  };

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      '/workspace/bijou',
      '  docs/',
      '  examples/',
      '▶ packages/',
      '  README.md',
      '  package.json',
    ].join('\n');
  }

  return boxSurface(filePickerSurface(pickerState, {
    width: Math.max(28, Math.min(width, 44)),
  }), {
    title,
    width: Math.max(34, Math.min(width, 48)),
    ctx,
  });
}

function explorationListPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'enumerated' | 'browsable';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  if (mode === 'enumerated') {
    const preview = enumeratedList([
      'Review deployment notes',
      'Open notification archive',
      'Promote canary',
      'Watch rollout health',
    ], {
      style: 'arabic',
      indent: 2,
      ctx,
    });

    if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
      return [title, '', preview].join('\n');
    }

    return boxSurface(contentSurface(preview), {
      title,
      width: Math.max(40, Math.min(width, 58)),
      ctx,
    });
  }

  const listState = createBrowsableListState({
    items: [
      { label: 'Release dashboard', value: 'dash', description: 'Operational overview and current rollout state' },
      { label: 'Notification archive', value: 'archive', description: 'Review earlier warnings and actions' },
      { label: 'Component field guide', value: 'docs', description: 'Reference surface for shipped families' },
      { label: 'Settings', value: 'settings', description: 'Tune shell hints and landing quality' },
    ],
    height: 4,
  });

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      '• Release dashboard',
      '• Notification archive',
      '• Component field guide',
      '• Settings',
    ].join('\n');
  }

  return boxSurface(browsableListSurface(listState, {
    width: Math.max(34, Math.min(width, 52)),
    ctx,
  }), {
    title,
    width: Math.max(38, Math.min(width, 56)),
    ctx,
  });
}

function temporalPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'timeline' | 'dag';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  const preview = mode === 'timeline'
    ? timeline([
        { label: 'Build created', description: 'Artifacts stamped for review', status: 'success' },
        { label: 'Canary promoted', description: '10% traffic live in eu-west', status: 'info' },
        { label: 'Latency drift detected', description: 'Retry backlog climbed above baseline', status: 'warning' },
      ], { ctx })
    : dag([
        { id: 'build', label: 'Build', edges: ['test'], badge: 'DONE' },
        { id: 'test', label: 'Test', edges: ['review'], badge: 'DONE' },
        { id: 'review', label: 'Review', edges: ['deploy'], badge: 'READY' },
        { id: 'deploy', label: 'Deploy', badge: 'BLOCKED' },
      ], { ctx });

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [title, '', preview].join('\n');
  }

  return boxSurface(contentSurface(preview), {
    title,
    width: Math.max(42, Math.min(width, 64)),
    ctx,
  });
}

function motionPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'wave' | 'braille';
  readonly timeMs: number;
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
    timeMs,
  } = input;

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      mode === 'wave'
        ? 'Animated shader field lowers to a truthful final-state snapshot.'
        : 'High-resolution motion lowers to explicit static state text when motion is unavailable.',
    ].join('\n');
  }

  const panelWidth = Math.max(42, Math.min(width, 60));
  const art = canvas(panelWidth - 2, 8, ({ u, v, time }) => {
    const dx = u - 0.5;
    const dy = (v - 0.5) * 1.8;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const wave = Math.sin(dist * 10 - time * 3) * 0.5 + 0.5;
    return wave > (mode === 'wave' ? 0.55 : 0.6) ? '█' : ' ';
  }, {
    time: timeMs / 1000,
    resolution: mode === 'wave' ? 'quad' : 'braille',
  });

  return boxSurface(column([
    art,
    spacer(),
    line(mutedText(ctx, mode === 'wave'
      ? 'Use motion when it reinforces state change, not just because it looks lively.'
      : 'Higher-resolution shader output still needs an honest no-motion fallback.'), panelWidth - 2),
  ]), {
    title,
    width: panelWidth,
    ctx,
  });
}

function appShellPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'shell' | 'palette';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      'DOGFOOD shell',
      'Page: Docs',
      mode === 'palette' ? 'Command palette: search “docs”' : 'Status: NORMAL • docs • ctrl+p palette',
    ].join('\n');
  }

  const screenWidth = Math.max(50, Math.min(width, 66));
  const screenHeight = 14;
  const screen = createSurface(screenWidth, screenHeight);
  const header = statusBarSurface({
    left: 'DOGFOOD',
    center: mode === 'palette' ? 'command discovery' : 'docs workspace',
    right: 'ctrl+p palette',
    width: screenWidth,
    fillChar: '─',
  });
  const footer = statusBarSurface({
    left: 'NORMAL',
    center: 'page:docs',
    right: '? help • / search',
    width: screenWidth,
    fillChar: '─',
  });
  const pane = boxSurface(column([
    line('Current page', screenWidth - 8),
    spacer(),
    line('DOGFOOD now teaches shell chrome, overlays, and docs content in the same runtime.', screenWidth - 8),
  ]), {
    title,
    width: screenWidth - 4,
    ctx,
  });
  screen.blit(header, 0, 0);
  screen.blit(pane, 2, 2);
  screen.blit(footer, 0, screenHeight - 1);

  if (mode === 'palette') {
    const paletteState = cpFilter(createCommandPaletteState([
      { id: 'docs', label: 'Open docs', description: 'Jump to the field guide', category: 'Navigate' },
      { id: 'download', label: 'Download coverage report', description: 'Open the latest docs summary', category: 'Actions' },
      { id: 'settings', label: 'Open settings', description: 'Shell-level preferences', category: 'Shell', shortcut: 'F2' },
      { id: 'notify', label: 'Review notifications', description: 'Open the notice drawer', category: 'Shell' },
    ], 4), 'do');
    const palette = commandPaletteSurface(paletteState, {
      width: Math.max(30, screenWidth - 12),
      ctx,
    });
    screen.blit(palette, 6, 4);
  }

  return screen;
}

function workspaceLayoutPreview(input: {
  readonly width: number;
  readonly ctx: BijouContext;
  readonly title: string;
  readonly mode: 'split' | 'grid';
}): string | Surface {
  const {
    width,
    ctx,
    title,
    mode,
  } = input;

  if (ctx.mode === 'pipe' || ctx.mode === 'accessible') {
    return [
      title,
      '',
      mode === 'split'
        ? 'Files | Editor'
        : 'Header / Navigation / Logs / Main view',
    ].join('\n');
  }

  const panelWidth = Math.max(48, Math.min(width, 64));
  const body = mode === 'split'
    ? splitPaneSurface(createSplitPaneState({ ratio: 0.36, focused: 'b' }), {
        direction: 'row',
        width: panelWidth - 2,
        height: 10,
        minA: 16,
        minB: 18,
        paneA: (paneWidth, paneHeight) => boxSurface(`Files\n\n- stories.ts\n- app.ts\n- coverage.ts\n\n${paneWidth}x${paneHeight}`, {
          width: paneWidth,
          ctx,
        }),
        paneB: (paneWidth, paneHeight) => boxSurface(`Editor\n\nconst floor = 64;\nconst next = 69;\n\n${paneWidth}x${paneHeight}`, {
          width: paneWidth,
          ctx,
        }),
      })
    : gridSurface({
        width: panelWidth - 2,
        height: 10,
        columns: [18, '1fr'],
        rows: [3, '1fr', 4],
        areas: [
          'header header',
          'nav main',
          'log main',
        ],
        gap: 1,
        cells: {
          header: (paneWidth) => boxSurface('Workspace layout', { width: paneWidth, ctx }),
          nav: (paneWidth, paneHeight) => boxSurface(`Families\n\n- forms\n- docs\n- shell\n\n${paneWidth}x${paneHeight}`, { width: paneWidth, ctx }),
          log: (paneWidth, paneHeight) => boxSurface(`Log\n\n[ok] build\n[ok] docs\n\n${paneWidth}x${paneHeight}`, { width: paneWidth, ctx }),
          main: (paneWidth, paneHeight) => boxSurface(`Main pane\n\nLayout primitives keep simultaneous context honest.\n\n${paneWidth}x${paneHeight}`, { width: paneWidth, ctx }),
        },
      });

  return boxSurface(body, {
    title,
    width: panelWidth,
    ctx,
  });
}

export const COMPONENT_STORIES: readonly DogfoodComponentStory[] = [
  {
    kind: 'component',
    id: 'alert',
    coverageFamilyIds: ['in-flow-status-block'],
    family: 'Status and in-flow feedback',
    title: 'alert()',
    package: 'bijou',
    docs: {
      summary: 'Persistent in-flow status block for success, warning, error, and informational state that should remain part of the page instead of floating above it.',
      useWhen: [
        'A page or form needs a status callout that should stay visible while the user continues reading nearby content.',
        'You need an honest escalation step above `note()` but below shell-managed notifications or blocking overlays.',
        'The message needs graceful lowering across interactive, static, pipe, and accessible modes.',
      ],
      avoidWhen: [
        'The message is transient and should disappear on its own; prefer `toast()` or the notification system.',
        'The user must respond before continuing; prefer `modal()` or a confirmation flow.',
        'The content is purely decorative or ambient and does not change decision-making.',
      ],
      relatedFamilies: ['note()', 'toast()', 'renderNotificationStack()'],
      gracefulLowering: {
        interactive: 'Styled bordered block with a status icon and elevated background.',
        static: 'Single-frame bordered block with the same semantic iconography but no animation.',
        pipe: 'Bracketed status prefix like `[ERROR] message`.',
        accessible: 'Plain spoken prefix like `Error: message`.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'success',
        label: 'Success',
        description: 'Positive completion that should stay attached to the current task.',
        render: ({ ctx }) => alert('Deployment completed successfully.', { variant: 'success', ctx }),
      },
      {
        id: 'warning',
        label: 'Warning',
        description: 'The user can continue, but only after reading the caution.',
        render: ({ ctx }) => alert('Migrations are queued behind a schema lock. Review the rollout window.', {
          variant: 'warning',
          ctx,
        }),
      },
      {
        id: 'error',
        label: 'Error',
        description: 'The flow should stop until the user understands the failure.',
        render: ({ ctx }) => alert('Release failed: 3 workers did not acknowledge the new image.', {
          variant: 'error',
          ctx,
        }),
      },
    ],
    tags: ['status', 'feedback', 'lowering'],
  },
  {
    kind: 'component',
    id: 'badge',
    coverageFamilyIds: ['inline-status'],
    family: 'Status and in-flow feedback',
    title: 'badge()',
    package: 'bijou',
    docs: {
      summary: 'Compact inline status label for states that belong beside another object instead of becoming their own block.',
      useWhen: [
        'A state needs to stay attached to a row, heading, or summary instead of interrupting the layout.',
        'The label can stay short, stable, and glanceable.',
        'You need lightweight semantic emphasis that still lowers honestly outside rich mode.',
      ],
      avoidWhen: [
        'The message needs explanation or next-step guidance; prefer `alert()` or `note()`.',
        'The content is long enough to become a sentence instead of a label.',
        'The user must acknowledge the state before continuing.',
      ],
      relatedFamilies: ['alert()', 'note()', 'notification system'],
      gracefulLowering: {
        interactive: 'Compact themed inline chip that stays attached to the owning object.',
        static: 'Single-frame inline chip preserving the same terse label.',
        pipe: 'Plain inline text status label without depending on color.',
        accessible: 'Explicit spoken status next to the owning object in plain language.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'service-health',
        label: 'Service health',
        description: 'Inline status labels attached to operational rows instead of detached callouts.',
        render: ({ ctx }) => column([
          row(['api    ', badgeSurface('LIVE', 'success', ctx), '  p95 84ms']),
          spacer(),
          row(['queue  ', badgeSurface('DEGRADED', 'warning', ctx), '  backlog 12']),
          spacer(),
          row(['cron   ', badgeSurface('PAUSED', 'muted', ctx), '  waiting for window']),
        ]),
      },
      {
        id: 'release-metadata',
        label: 'Release metadata',
        description: 'Short supporting labels that belong inline with other metadata.',
        render: ({ ctx }) => column([
          row([
            badgeSurface('v4.0.0', 'accent', ctx),
            ' ',
            badgeSurface('MIT', 'muted', ctx),
            ' ',
            badgeSurface('TypeScript', 'info', ctx),
          ]),
          spacer(),
          row([
            'Server is ',
            badgeSurface('RUNNING', 'success', ctx),
            ' on port ',
            badgeSurface('3000', 'primary', ctx),
          ]),
        ]),
      },
    ],
    tags: ['status', 'inline', 'labels'],
  },
  {
    kind: 'component',
    id: 'modal',
    coverageFamilyIds: ['overlay-primitives'],
    family: 'Overlays and interruption',
    title: 'modal()',
    package: 'bijou-tui',
    docs: {
      summary: 'Centered blocking dialog for decisions that should temporarily own attention and input inside a TUI surface.',
      useWhen: [
        'The user must acknowledge or answer before the rest of the surface should accept more input.',
        'The dialog content is short, focused, and directly tied to the current surface state.',
        'You need shell-owned interruption, not a long-lived inspector or sidecar workspace.',
      ],
      avoidWhen: [
        'The content is supplemental and can live beside the main task; prefer `drawer()`.',
        'The message is low-severity and transient; prefer `toast()` or the notification stack.',
        'The body is long-form documentation or persistent inspection chrome.',
      ],
      relatedFamilies: ['drawer()', 'tooltip()', 'toast()'],
      gracefulLowering: {
        interactive: 'Centered bordered overlay dimming the background and temporarily owning input focus.',
        static: 'Single-frame snapshot of the blocking dialog for deterministic screenshots and CI.',
        pipe: 'Recommended lowering is an in-flow confirmation prompt or status note rather than a floating overlay.',
        accessible: 'Recommended lowering is explicit linear confirmation text with direct action language.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'confirm',
        label: 'Confirm deploy',
        description: 'Short blocking decision with explicit yes/no guidance.',
        render: ({ width, ctx }) => {
          const screenWidth = Math.max(32, width);
          const screenHeight = 14;
          const background = modalBackdrop(screenWidth, ctx);
          const dialog = modal({
            title: 'Confirm deploy',
            body: column([
              line('Deploy release-control to production?'),
              spacer(),
              line('This will roll all workers and re-open the queue.'),
            ]),
            hint: line(`${kbd('y', { ctx })} yes • ${kbd('n', { ctx })} no • ${kbd('esc', { ctx })} cancel`),
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(background, [dialog], { dim: true });
        },
      },
      {
        id: 'help',
        label: 'Shortcut help',
        description: 'Small focused explanation for the current surface, not a full settings page.',
        render: ({ width, ctx }) => {
          const screenWidth = Math.max(32, width);
          const screenHeight = 14;
          const background = modalBackdrop(screenWidth, ctx);
          const dialog = modal({
            title: 'Keyboard help',
            body: column([
              line(`${kbd('j', { ctx })} ${kbd('k', { ctx })}  Move between stories`),
              line(`${kbd('1', { ctx })}…${kbd('4', { ctx })}  Switch profile`),
              line(`${kbd(',', { ctx })} ${kbd('.', { ctx })}  Cycle variants`),
            ]),
            hint: line(`Press ${kbd('esc', { ctx })} to return to the page`),
            screenWidth,
            screenHeight,
            borderToken: ctx.border('primary'),
            bgToken: ctx.surface('elevated'),
            ctx,
          });
          return compositeSurface(background, [dialog], { dim: true });
        },
      },
    ],
    tags: ['overlay', 'interruption', 'surface'],
  },
  {
    kind: 'component',
    id: 'progress-bar',
    coverageFamilyIds: ['progress-indicators'],
    family: 'Progress and loading',
    title: 'progressBar()',
    package: 'bijou',
    docs: {
      summary: 'Honest determinate progress indicator for work that can report a real completion percentage, with related support for indeterminate activity cues.',
      useWhen: [
        'The user needs clear feedback that work is ongoing and you can estimate percent-complete honestly.',
        'A task spans long enough that progress feedback helps more than it distracts.',
        'You want the task label and the progress indicator to stay visibly attached.',
      ],
      avoidWhen: [
        'The work is so brief that the indicator would flicker more than it helps.',
        'The state is better explained as a durable note, alert, or completion result.',
        'You do not know progress honestly; prefer an indeterminate spinner or explicit loading text.',
      ],
      relatedFamilies: ['skeleton()', 'badge()', 'notification system'],
      gracefulLowering: {
        interactive: 'Determinate bars and indeterminate activity cues stay visible with real motion only where motion is actually available.',
        static: 'Single deterministic frame preserving the same label and completion state without fake animation.',
        pipe: 'Explicit text progress like `Progress: 42%` or repeated status lines without pretending to animate.',
        accessible: 'Plain language announcing task, progress, and completion state explicitly.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-milestones',
        label: 'Release milestones',
        description: 'Static determinate checkpoints for work whose completion percentage is known.',
        render: ({ ctx }) => boxSurface(column([
          line(`Compile     ${progressBar(18, { width: 28, showPercent: true, ctx })}`),
          spacer(),
          line(`Canaries    ${progressBar(46, { width: 28, showPercent: true, ctx })}`),
          spacer(),
          line(`Artifacts   ${progressBar(73, { width: 28, showPercent: true, ctx })}`),
          spacer(),
          line(`Promote     ${progressBar(100, { width: 28, showPercent: true, ctx })}`),
        ]), {
          title: 'release pipeline',
          width: 48,
          ctx,
        }),
      },
      {
        id: 'looping-rollout',
        label: 'Looping rollout',
        description: 'Looping progress previews prove pulse-driven motion without requiring a separate story runtime.',
        render: ({ ctx, timeMs }) => {
          const rollout = loopingProgressPercent(timeMs, 0);
          const canaries = loopingProgressPercent(timeMs, 700);
          const assets = loopingProgressPercent(timeMs, 1_300);
          const spinnerTick = Math.floor(timeMs / 90);
          return boxSurface(column([
            line(`Rollout    ${progressBar(rollout, { width: 28, showPercent: true, ctx })}`),
            spacer(),
            line(`Canaries   ${progressBar(canaries, { width: 28, showPercent: true, ctx })}`),
            spacer(),
            line(`Assets     ${progressBar(assets, { width: 28, showPercent: true, ctx })}`),
            spacer(),
            line(`Watch      ${spinnerFrame(spinnerTick, { label: 'waiting for verification window', ctx })}`),
          ]), {
            title: 'looping rollout monitor',
            width: 56,
            ctx,
          });
        },
      },
    ],
    tags: ['progress', 'loading', 'animation'],
  },
  {
    kind: 'component',
    id: 'skeleton',
    coverageFamilyIds: ['loading-placeholders'],
    family: 'Progress and loading',
    title: 'skeleton()',
    package: 'bijou',
    docs: {
      summary: 'Shape-preserving loading placeholder for short-lived uncertainty when you know the information layout but not the data yet.',
      useWhen: [
        'The final content shape is known and preserving layout stability helps more than a separate loading page.',
        'The loading window is short enough that a placeholder remains believable.',
        'The surrounding labels can stay explicit so the user knows what is loading.',
      ],
      avoidWhen: [
        'Real partial content can already be shown honestly.',
        'The delay is long enough that a clearer progress indicator, retry path, or durable message is needed.',
        'The placeholder would become decorative filler instead of a faithful stand-in for the final layout.',
      ],
      relatedFamilies: ['progressBar()', 'spinnerFrame()', 'note()'],
      gracefulLowering: {
        interactive: 'Placeholder bars preserve approximate content shape while loading is genuinely transient.',
        static: 'Single deterministic placeholder frame with the same layout footprint.',
        pipe: 'Explicit loading text or field labels instead of decorative placeholder bars.',
        accessible: 'Plain loading-state language describing the affected region instead of relying on shape alone.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'form-shell',
        label: 'Form shell',
        description: 'Short-lived placeholders that preserve a known form layout without implying fake text.',
        render: ({ ctx }) => boxSurface(column([
          line('Name'),
          contentSurface(skeleton({ width: 26, ctx })),
          spacer(),
          line('Description'),
          contentSurface(skeleton({ width: 34, lines: 3, ctx })),
          spacer(),
          line('Owner'),
          contentSurface(skeleton({ width: 18, ctx })),
        ]), {
          title: 'new package',
          width: 40,
          ctx,
        }),
      },
      {
        id: 'card-region',
        label: 'Card region',
        description: 'Region-shaped placeholders that match the density of a summary card instead of spraying generic bars everywhere.',
        render: ({ ctx }) => boxSurface(column([
          line('Package summary'),
          spacer(),
          contentSurface(skeleton({ width: 32, lines: 2, ctx })),
          spacer(),
          line('Recent activity'),
          contentSurface(skeleton({ width: 28, lines: 3, ctx })),
        ]), {
          title: 'registry overview',
          width: 38,
          ctx,
        }),
      },
    ],
    tags: ['loading', 'placeholder', 'layout'],
  },
  {
    kind: 'component',
    id: 'toast',
    coverageFamilyIds: ['low-level-transient-overlay'],
    family: 'Feedback overlays and history',
    title: 'toast()',
    package: 'bijou-tui',
    docs: {
      summary: 'Low-level transient overlay primitive for one directly composed, anchored notification when the full notification system would be too heavy.',
      useWhen: [
        'You are composing one transient overlay directly inside a local surface.',
        'Explicit corner anchoring matters.',
        'The app does not need stacking, routing, actions, or history for this message.',
      ],
      avoidWhen: [
        'The app needs stacking, routing, actions, or recall; prefer the notification system.',
        'The message should stay in page flow; prefer `alert()` or `note()`.',
        'The surface needs supplemental work or a blocking decision; prefer `drawer()` or `modal()`.',
      ],
      relatedFamilies: ['alert()', 'notification system', 'modal()'],
      gracefulLowering: {
        interactive: 'Anchored transient overlay with explicit variant and placement over the current surface.',
        static: 'Single deterministic overlay frame preserving the same variant and placement.',
        pipe: 'Plain one-off event line or app-owned status output instead of a floating overlay.',
        accessible: 'Explicit announcement text describing the transient event without relying on spatial position.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'saved-top-right',
        label: 'Saved notification',
        description: 'A directly composed success toast anchored to the current working surface.',
        render: ({ width, ctx }) => {
          const screenWidth = Math.max(36, width);
          const screenHeight = 12;
          const overlay = toast({
            message: 'Operation saved.',
            variant: 'success',
            anchor: 'top-right',
            screenWidth,
            screenHeight,
            ctx,
          });
          if (ctx.mode === 'interactive' || ctx.mode === 'static') {
            return compositeSurface(toastBackdrop(screenWidth, screenHeight, ctx), [overlay]);
          }
          return overlay.content;
        },
      },
      {
        id: 'error-bottom-left',
        label: 'Anchored error',
        description: 'Low-level toast placement remains explicit when one local failure needs brief attention.',
        render: ({ width, ctx }) => {
          const screenWidth = Math.max(36, width);
          const screenHeight = 12;
          const overlay = toast({
            message: 'Rollback required before promote.',
            variant: 'error',
            anchor: 'bottom-left',
            screenWidth,
            screenHeight,
            ctx,
          });
          if (ctx.mode === 'interactive' || ctx.mode === 'static') {
            return compositeSurface(toastBackdrop(screenWidth, screenHeight, ctx), [overlay]);
          }
          return overlay.content;
        },
      },
    ],
    tags: ['feedback', 'overlay', 'transient'],
  },
  {
    kind: 'component',
    id: 'log',
    coverageFamilyIds: ['activity-stream'],
    family: 'Feedback overlays and history',
    title: 'log()',
    package: 'bijou',
    docs: {
      summary: 'Chronological activity-stream primitive for accumulating operational events with explicit severity and optional timestamps.',
      useWhen: [
        'Order and accumulation matter more than interruption.',
        'The user benefits from scanning a timeline of events instead of only the latest status.',
        'The output should remain honest in pipe and accessible modes as plain chronological text.',
      ],
      avoidWhen: [
        'The message should interrupt or demand immediate attention; prefer `alert()` or `toast()`.',
        'A single inline label or current status is enough.',
        'The user needs a summary panel instead of raw chronological events.',
      ],
      relatedFamilies: ['notification system', 'alert()', 'badge()'],
      gracefulLowering: {
        interactive: 'Chronological lines with level cues and optional timestamps remain scannable in place.',
        static: 'Single deterministic activity transcript preserving order and severity cues.',
        pipe: 'Plain sequential output is already a natural fit.',
        accessible: 'Timestamps and levels stay explicit in linear text without decorative formatting.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-events',
        label: 'Release events',
        description: 'Chronological accumulation of mixed-severity deployment events.',
        render: ({ ctx }) => box([
          log('debug', 'Connecting to release queue...', { ctx }),
          log('info', 'Canary started in eu-west', { ctx }),
          log('warn', '2 workers still draining old jobs', { ctx }),
          log('error', 'One verification probe timed out', { ctx }),
        ].join('\n'), {
          title: 'activity stream',
          width: 54,
          ctx,
        }),
      },
      {
        id: 'timed-audit',
        label: 'Timed audit',
        description: 'Optional timestamps help when the event order itself needs auditing.',
        render: ({ ctx }) => box([
          log('info', 'Rollout window opened', { timestamp: true, ctx }),
          log('info', 'Canaries reached 25%', { timestamp: true, ctx }),
          log('warn', 'Waiting on staging approval', { timestamp: true, ctx }),
        ].join('\n'), {
          title: 'release audit',
          width: 54,
          ctx,
        }),
      },
    ],
    tags: ['feedback', 'history', 'events'],
  },
  {
    kind: 'component',
    id: 'confirm',
    coverageFamilyIds: ['binary-decision'],
    family: 'Decision and selection forms',
    title: 'confirm()',
    package: 'bijou',
    docs: {
      summary: 'Binary decision prompt for real yes/no choices where the consequence of accepting or declining should stay explicit.',
      useWhen: [
        'The user is making a genuine yes/no decision and both outcomes are easy to explain plainly.',
        'A destructive or consequential action needs one explicit final checkpoint.',
        'The prompt can stay short while still naming what yes and no actually do.',
      ],
      avoidWhen: [
        'The user really needs to compare more than two outcomes.',
        'The prompt is vague enough that yes or no would be ambiguous.',
        'The choice belongs inside a longer staged flow with more context; prefer `wizard()` or `group()` there.',
      ],
      relatedFamilies: ['modal()', 'alert()', 'wizard()'],
      gracefulLowering: {
        interactive: 'Focused yes/no prompt with an explicit default and natural keyboard confirmation.',
        static: 'Deterministic prompt snapshot that keeps the question and default state honest.',
        pipe: 'Plain textual yes/no prompt with the default orientation preserved.',
        accessible: 'Explicit binary question plus default state in plain language.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'deploy-gate',
        label: 'Deploy gate',
        description: 'Default-no confirmation for a consequential production action.',
        render: ({ width, ctx }) => confirmPreview({
          width,
          ctx,
          question: 'Deploy to production?',
          defaultValue: false,
          yesMeaning: 'Promote the canary and begin the production rollout.',
          noMeaning: 'Keep the rollout paused for review.',
        }),
      },
      {
        id: 'discard-draft',
        label: 'Discard draft',
        description: 'A destructive decision still needs both outcomes named explicitly.',
        render: ({ width, ctx }) => confirmPreview({
          width,
          ctx,
          question: 'Discard unsaved release notes?',
          defaultValue: false,
          yesMeaning: 'Drop the local draft and close the editor.',
          noMeaning: 'Return to editing and keep the draft open.',
        }),
      },
    ],
    tags: ['forms', 'decision', 'confirmation'],
  },
  {
    kind: 'component',
    id: 'multiselect',
    coverageFamilyIds: ['multiple-choice'],
    family: 'Decision and selection forms',
    title: 'multiselect()',
    package: 'bijou',
    docs: {
      summary: 'Set-selection prompt for building a durable group of choices with keyboard toggling and truthful numbered fallbacks.',
      useWhen: [
        'The user is choosing several members of one coherent set.',
        'Default selections should be visible before the user starts toggling.',
        'The flow should lower honestly to numbered or comma-separated selection outside rich mode.',
      ],
      avoidWhen: [
        'The result is singular; prefer `select()` or `filter()`.',
        'The rows are really actions or commands instead of lasting set members.',
        'The flow needs grouped validation or staged progression; prefer `group()` or `wizard()`.',
      ],
      relatedFamilies: ['select()', 'filter()', 'group()'],
      gracefulLowering: {
        interactive: 'Checkbox-style set selection with focus, toggling, and explicit confirmation.',
        static: 'Deterministic snapshot of the current set and visible choices.',
        pipe: 'Numbered textual selection with comma-separated input.',
        accessible: 'Plain text list that names which options are currently selected.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-stack',
        label: 'Release stack',
        description: 'Preselected tools keep the initial set obvious before the user starts changing it.',
        render: ({ width, ctx }) => multiselectPreview({
          width,
          ctx,
          title: 'Enable release checks:',
          options: [
            { label: 'TypeScript', description: 'type-safe JavaScript' },
            { label: 'Vitest', description: 'unit testing' },
            { label: 'Playwright', description: 'end-to-end tests' },
            { label: 'Docker', description: 'container packaging' },
          ],
          selectedIndices: [0, 1],
          focusedIndex: 1,
        }),
      },
      {
        id: 'notification-channels',
        label: 'Notification channels',
        description: 'Multiple related outputs can be chosen together without turning the flow into command dispatch.',
        render: ({ width, ctx }) => multiselectPreview({
          width,
          ctx,
          title: 'Notify rollout channels:',
          options: [
            { label: 'Slack', description: 'release room' },
            { label: 'Status page', description: 'customer-facing notice' },
            { label: 'PagerDuty', description: 'incident escalation' },
            { label: 'Email', description: 'stakeholder summary' },
          ],
          selectedIndices: [0, 1, 3],
          focusedIndex: 2,
        }),
      },
    ],
    tags: ['forms', 'selection', 'set-building'],
  },
  {
    kind: 'component',
    id: 'select',
    coverageFamilyIds: ['single-choice'],
    family: 'Decision and selection forms',
    title: 'select() / filter()',
    package: 'bijou',
    docs: {
      summary: 'Single-choice prompt family for choosing one lasting value, either from a visible list or from a searchable narrowed list.',
      useWhen: [
        'The user is choosing exactly one durable value from a known set of options.',
        'The options can either fit as a visible list (`select()`) or benefit from search narrowing (`filter()`).',
        'The flow should lower honestly to numbered or text-search prompts outside rich mode.',
      ],
      avoidWhen: [
        'The user needs to keep several options at once; prefer `multiselect()`.',
        'The rows are commands or tabs rather than one chosen value.',
        'The flow needs grouped validation or staged progression; prefer `group()` or `wizard()`.',
      ],
      relatedFamilies: ['multiselect()', 'confirm()', 'tabs()'],
      gracefulLowering: {
        interactive: 'Focused list or filter prompt that keeps one obvious current choice and supports natural keyboard confirmation.',
        static: 'Deterministic snapshot of the current choice set or narrowed search results.',
        pipe: 'Numbered or text-search prompt that still resolves to one final value explicitly.',
        accessible: 'Plain-language options that name the selected value and search query directly.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-policy',
        label: 'Release policy',
        description: 'Visible single-choice list where the whole decision set fits on screen without search.',
        render: ({ width, ctx }) => selectPreview({
          width,
          ctx,
          title: 'Choose a release policy:',
          options: [
            { label: 'Canary only', description: 'ship to 10% and stop' },
            { label: 'Auto promote', description: 'promote once checks pass' },
            { label: 'Hold for review', description: 'require manual approval' },
            { label: 'Abort', description: 'cancel the rollout' },
          ],
          selectedIndex: 1,
          focusedIndex: 1,
        }),
      },
      {
        id: 'runtime-search',
        label: 'Searchable runtime',
        description: 'Search narrows a larger single-choice list without changing the one-value contract.',
        render: ({ width, ctx }) => filterPreview({
          width,
          ctx,
          title: 'Choose a programming language:',
          query: 'ty',
          options: [
            { label: 'TypeScript', description: 'typed JavaScript for apps', keywords: ['javascript', 'typed', 'web'] },
            { label: 'Python', description: 'scripting and data work', keywords: ['scripting', 'ml', 'data'] },
            { label: 'OCaml', description: 'typed ML family runtime', keywords: ['functional', 'ml', 'typed'] },
            { label: 'Rust', description: 'systems safety and speed', keywords: ['systems', 'memory', 'safe'] },
          ],
          matchedIndices: [0, 1, 2],
          selectedIndex: 0,
        }),
      },
    ],
    tags: ['forms', 'selection', 'search'],
  },
  {
    kind: 'component',
    id: 'text-entry',
    coverageFamilyIds: ['text-entry'],
    family: 'Decision and selection forms',
    title: 'input() / textarea()',
    package: 'bijou',
    docs: {
      summary: 'Text-entry family for collecting freeform user input, from short single-line identifiers to longer multiline notes that still need honest lowering.',
      useWhen: [
        'The user is providing text rather than choosing from a fixed set of options.',
        'A short field (`input()`) or a longer multiline editor (`textarea()`) is the real job, not just supporting metadata.',
        'Prompt, current value, and validation state should remain truthful in rich, pipe, and accessible modes.',
      ],
      avoidWhen: [
        'The options are already enumerable; prefer `select()` or `multiselect()`.',
        'The user is progressing through several related inputs as one staged task; prefer `group()` or `wizard()`.',
        'The content is only a passive note or status and does not require user text entry.',
      ],
      relatedFamilies: ['select()', 'filter()', 'group()', 'wizard()'],
      gracefulLowering: {
        interactive: 'Focused field or editor treatment keeps prompt, current value, and validation visible without pretending text entry is just static prose.',
        static: 'Single deterministic snapshot of the current value or prompt state remains honest about what the field is collecting.',
        pipe: 'Line-buffered textual prompts keep the label, value, and validation explicit in plain text.',
        accessible: 'Prompt, entry type, current value, and validation cues remain explicit in one readable linear flow.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'service-name',
        label: 'Service name',
        description: 'Single-line entry for a stable identifier with clear constraints and current value.',
        render: ({ width, ctx }) => textEntryPreview({
          width,
          ctx,
          title: 'Choose a package slug:',
          label: 'Package name',
          value: 'release-control',
          helperText: 'Used in URLs, artifacts, and release announcements.',
          validationText: 'Use lowercase kebab-case.',
        }),
      },
      {
        id: 'incident-summary',
        label: 'Incident summary',
        description: 'Multiline entry for operator notes and context that would not fit honestly in one short field.',
        render: ({ width, ctx }) => textEntryPreview({
          width,
          ctx,
          title: 'Write a rollout summary:',
          label: 'Summary',
          value: [
            'Canary passed in eu-west after one retry.',
            'Hold promotion until the background queue drains.',
          ].join('\n'),
          helperText: 'Use multiline entry when the note itself matters, not just the final status.',
          multiline: true,
        }),
      },
    ],
    tags: ['forms', 'input', 'text'],
  },
  {
    kind: 'component',
    id: 'group-wizard',
    coverageFamilyIds: ['multi-field-and-staged-forms'],
    family: 'Decision and selection forms',
    title: 'group() / wizard()',
    package: 'bijou',
    docs: {
      summary: 'Grouped and staged form family for related inputs that belong together, whether they happen in one focused section or across explicit steps.',
      useWhen: [
        'Several related fields need one shared goal instead of feeling like disconnected prompts.',
        'A grouped form (`group()`) or staged flow (`wizard()`) should keep progress and summary language explicit.',
        'The result needs more structure than one choice or one text field can provide honestly.',
      ],
      avoidWhen: [
        'Only one binary or one-choice decision is being made; prefer `confirm()` or `select()`.',
        'The fields are unrelated and should not be bundled into one form narrative.',
        'The content is really documentation, explanation, or inspection rather than data collection.',
      ],
      relatedFamilies: ['input()', 'textarea()', 'select()', 'confirm()'],
      gracefulLowering: {
        interactive: 'Grouped or staged form panels preserve field rhythm, current step, and summary cues without pretending the flow is just one big text prompt.',
        static: 'Deterministic snapshots keep the current group or wizard step explicit for docs and screenshots.',
        pipe: 'Sequential textual prompts preserve grouping and step intent instead of flattening unrelated fields together.',
        accessible: 'Field labels, step names, and progress stay explicit in linear reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'deploy-group',
        label: 'Deploy group',
        description: 'One grouped deployment form keeps related fields together without inventing fake steps.',
        render: ({ width, ctx }) => stagedFormPreview({
          width,
          ctx,
          title: 'Prepare a production deploy:',
          mode: 'group',
          fields: [
            { label: 'Environment', value: 'production' },
            { label: 'Window', value: 'Tonight, 17:00-18:00 PDT' },
            { label: 'Approver', value: 'Release manager on call' },
          ],
          summaryText: 'Use grouped forms when the user is filling out one coherent packet of related fields.',
        }),
      },
      {
        id: 'rollout-wizard',
        label: 'Rollout wizard',
        description: 'A staged flow keeps the current step and remaining work explicit instead of dumping every field at once.',
        render: ({ width, ctx }) => stagedFormPreview({
          width,
          ctx,
          title: 'Plan the rollout:',
          mode: 'wizard',
          stepLabel: 'Step 2 of 3 • Verification',
          fields: [
            { label: 'Health threshold', value: '0 failed probes for 10m' },
            { label: 'Fallback owner', value: 'platform-ops' },
          ],
          summaryText: 'Use staged forms when progress and step boundaries matter more than one giant grouped panel.',
        }),
      },
    ],
    tags: ['forms', 'wizard', 'group'],
  },
  {
    kind: 'component',
    id: 'tabs',
    coverageFamilyIds: ['peer-navigation'],
    family: 'Navigation and organization',
    title: 'tabs()',
    package: 'bijou',
    docs: {
      summary: 'Peer-navigation strip for switching between sibling sections that share one workspace and one conceptual level.',
      useWhen: [
        'The user is moving between peer sections of the same task or document.',
        'One active sibling needs to stay obvious without implying progress or hierarchy.',
        'The labels can stay short enough to scan inline as one navigation band.',
      ],
      avoidWhen: [
        'The steps imply sequence or completion; prefer `stepper()` or another progress-oriented surface.',
        'The content is hierarchical rather than peer-level; prefer `tree()` or progressive disclosure.',
        'The labels are so numerous or verbose that the strip stops being glanceable.',
      ],
      relatedFamilies: ['breadcrumb()', 'paginator()', 'accordion()'],
      gracefulLowering: {
        interactive: 'Active tab stays visually distinct while sibling sections remain visible beside it.',
        static: 'Single deterministic tab strip preserves the same peer relationship and active section.',
        pipe: 'Plain text tab labels keep the active peer explicit with bracketed emphasis.',
        accessible: 'Each peer section is read explicitly with active state called out in order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-workbench',
        label: 'Release workbench',
        description: 'Peer operational sections stay visible as one band without implying a step-by-step wizard.',
        render: ({ ctx }) => box([
          tabs([
            { label: 'Overview' },
            { label: 'Checks', badge: '3' },
            { label: 'Rollout', badge: '2' },
            { label: 'Logs' },
          ], { active: 2, ctx }),
          '',
          `Current pane: ${infoText(ctx, 'Rollout')}`,
          mutedText(ctx, 'Peer sections share one workspace; switching does not imply completion.'),
        ].join('\n'), {
          title: 'peer navigation',
          width: 60,
          ctx,
        }),
      },
      {
        id: 'settings-sections',
        label: 'Settings sections',
        description: 'Compact peer sections remain readable even when one carries supporting metadata.',
        render: ({ ctx }) => box([
          tabs([
            { label: 'General' },
            { label: 'Appearance' },
            { label: 'Notifications', badge: '2' },
          ], { active: 1, ctx }),
          '',
          `Current pane: ${infoText(ctx, 'Appearance')}`,
          mutedText(ctx, 'Use tabs when the user is switching sibling sections, not confirming steps.'),
        ].join('\n'), {
          title: 'settings sections',
          width: 56,
          ctx,
        }),
      },
    ],
    tags: ['navigation', 'tabs', 'organization'],
  },
  {
    kind: 'component',
    id: 'markdown',
    coverageFamilyIds: ['formatted-documents-and-prose'],
    family: 'Documents and references',
    title: 'markdown()',
    package: 'bijou',
    docs: {
      summary: 'Bounded structured prose renderer for help, release notes, and reference text that should stay honest across rich, pipe, and accessible modes.',
      useWhen: [
        'Help, reference, or release-note prose needs lightweight structure without becoming a whole document reader.',
        'The same content should remain understandable in interactive, static, pipe, and accessible modes.',
        'Headings, lists, links, or short quotes materially improve scannability.',
      ],
      avoidWhen: [
        'The app is really composing interface chrome, forms, or layout rather than prose.',
        'The content needs deep navigation instead of one bounded rendered block.',
        'Browser-grade markdown fidelity or arbitrary user-authored documents are expected.',
      ],
      relatedFamilies: ['hyperlink()', 'box()', 'pager()'],
      gracefulLowering: {
        interactive: 'Bounded structured prose keeps headings, emphasis, lists, and links readable within terminal constraints.',
        static: 'Single deterministic document block preserves the same structure without live interaction.',
        pipe: 'Plain text keeps heading/list/code semantics understandable without styling.',
        accessible: 'Headings, lists, links, and code cues stay explicit in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-note',
        label: 'Release note',
        description: 'A bounded markdown document that behaves like reference prose instead of layout chrome.',
        render: ({ ctx }) => box(markdown(MARKDOWN_RELEASE_NOTES, { width: 42, ctx }), {
          title: 'release note',
          width: 50,
          ctx,
        }),
      },
      {
        id: 'help-excerpt',
        label: 'Help excerpt',
        description: 'Short structured help text stays scannable without becoming a full document browser.',
        render: ({ ctx }) => box(markdown([
          '## Quick start',
          '',
          '1. Open the command palette.',
          '2. Search for a component family.',
          '3. Read the usage notes before choosing a surface.',
          '',
          'Use [`hyperlink()`](https://github.com/flyingrobots/bijou) when the destination itself matters.',
        ].join('\n'), { width: 42, ctx }), {
          title: 'help excerpt',
          width: 50,
          ctx,
        }),
      },
    ],
    tags: ['docs', 'prose', 'reference'],
  },
  {
    kind: 'component',
    id: 'hyperlink',
    coverageFamilyIds: ['linked-destinations'],
    family: 'Documents and references',
    title: 'hyperlink()',
    package: 'bijou',
    docs: {
      summary: 'Explicit destination primitive for links that should remain meaningful whether or not the terminal supports clickable OSC 8 output.',
      useWhen: [
        'The destination matters and should remain part of the rendered output.',
        'Supporting terminals should get clickability without hiding the destination semantics.',
        'Fallback behavior needs to stay intentional in pipe or accessible modes.',
      ],
      avoidWhen: [
        'The destination is ambiguous or should not be activated casually.',
        'The label is generic and hides the real meaning or trust context.',
        'The user needs an app-owned action rather than an external destination.',
      ],
      relatedFamilies: ['markdown()', 'note()', 'helpView()'],
      gracefulLowering: {
        interactive: 'Meaningful visible link text remains present while supporting terminals get OSC 8 clickability.',
        static: 'Deterministic link text still preserves the same explicit destination semantics.',
        pipe: 'Fallback modes keep the destination or label explicit in plain text.',
        accessible: 'Label and destination remain clear in reading order without assuming clickability.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'explicit-destinations',
        label: 'Explicit destinations',
        description: 'Link labels describe the destination instead of hiding it behind generic action copy.',
        render: ({ ctx }) => box([
          `Repository: ${hyperlink('flyingrobots/bijou', 'https://github.com/flyingrobots/bijou', { ctx })}`,
          '',
          `API docs: ${hyperlink('README reference', 'https://github.com/flyingrobots/bijou#readme', { ctx })}`,
        ].join('\n'), {
          title: 'linked destinations',
          width: 58,
          ctx,
        }),
      },
      {
        id: 'fallback-modes',
        label: 'Fallback modes',
        description: 'Fallback formatting remains an explicit product choice when clickable links are unavailable.',
        render: ({ ctx }) => box([
          `Both: ${hyperlink('Release notes', 'https://example.com/release-notes', { fallback: 'both', ctx })}`,
          '',
          `URL only: ${hyperlink('API reference', 'https://example.com/api', { fallback: 'url', ctx })}`,
          '',
          `Text only: ${hyperlink('Trusted local handbook', 'https://example.com/handbook', { fallback: 'text', ctx })}`,
        ].join('\n'), {
          title: 'fallback policy',
          width: 62,
          ctx,
        }),
      },
    ],
    tags: ['docs', 'links', 'destinations'],
  },
  {
    kind: 'component',
    id: 'box',
    coverageFamilyIds: ['framed-grouping'],
    family: 'Structural grouping and inspection',
    title: 'box()',
    package: 'bijou',
    docs: {
      summary: 'Canonical containment primitive for grouped content and compact titled panels, with `headerBox()` and surface companions for richer layout composition.',
      useWhen: [
        'A region needs visible containment so sibling working areas read as distinct jobs.',
        'A compact titled panel needs terse supporting detail such as scope, version, or environment.',
        'Grouping helps comprehension more honestly than another heading or paragraph break alone.',
      ],
      avoidWhen: [
        'The border would only add decoration and not communicate real containment.',
        'Urgency or interruption is the primary job; prefer `alert()` or `modal()`.',
        'Whitespace, a separator, or a simple heading would already explain the structure clearly.',
      ],
      relatedFamilies: ['separator()', 'alert()', 'inspector()'],
      gracefulLowering: {
        interactive: 'Bordered or titled containment stays visible so grouped regions remain distinct working areas.',
        static: 'Single deterministic grouped panels preserve the same containment and title/detail cues.',
        pipe: 'Plain grouped text with spacing and optional titles instead of decorative borders.',
        accessible: 'Preserve title and content order without depending on borders or color.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'header-detail',
        label: 'Header detail',
        description: 'Compact titled grouping with terse metadata instead of a full explanatory sentence.',
        render: ({ ctx }) => [
          headerBox('Deploy', { detail: 'v4.0.0 → production', ctx }),
          '',
          box('Window\n\n- freeze at 17:00\n- canaries at 17:15\n- promote after verification', {
            title: 'release window',
            width: 38,
            ctx,
          }),
        ].join('\n'),
      },
      {
        id: 'peer-panels',
        label: 'Peer panels',
        description: 'Contained sibling regions that read as separate work areas instead of one blended block.',
        render: ({ ctx }) => row([
          boxSurface('Signals\n\n- latency\n- throughput\n- queue depth', {
            title: 'ops',
            width: 20,
            ctx,
          }),
          spacer(2),
          boxSurface('Actions\n\n- confirm deploy\n- watch canaries\n- page owner', {
            title: 'release',
            width: 22,
            ctx,
          }),
        ]),
      },
    ],
    tags: ['structure', 'grouping', 'panels'],
  },
  {
    kind: 'component',
    id: 'inspector',
    coverageFamilyIds: ['inspector-panels'],
    family: 'Structural grouping and inspection',
    title: 'inspector()',
    package: 'bijou',
    docs: {
      summary: 'Canonical side-panel summary surface for the currently selected thing, keeping one obvious active value and calmer supporting sections nearby.',
      useWhen: [
        'A side panel needs to summarize the currently selected object without taking over the main task.',
        'One obvious active value should stay more prominent than the supporting details beneath it.',
        'Supporting context benefits from compact titled sections instead of freeform prose.',
      ],
      avoidWhen: [
        'The content is a guided recommendation with evidence and next-action structure; prefer `explainability()`.',
        'The content is only a one-line status or note.',
        'The panel needs its own deep navigation or multistep interaction model.',
      ],
      relatedFamilies: ['box()', 'explainability()', 'preferenceListSurface()'],
      gracefulLowering: {
        interactive: 'Titled containment, current-selection emphasis, and compact section rhythm stay visible in one calm panel.',
        static: 'Single deterministic panel preserves the same hierarchy without motion.',
        pipe: 'Explicit field labels keep the current selection obvious in plain grouped text.',
        accessible: 'Linearized plain-language fields preserve the same meaning without borders or color.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'package-summary',
        label: 'Package summary',
        description: 'A current selection with concise supporting sections that stay calmer than the main value.',
        render: ({ ctx }) => inspector({
          title: 'package summary',
          currentValue: 'release-control',
          supportingText: 'Currently selected package in the registry overview.',
          sections: [
            { title: 'Owner', content: 'Platform' },
            { title: 'Profile', content: 'Rich' },
            {
              title: 'Description',
              content: 'Coordinates the release queue, rollout window, and production promotion handoff.',
              tone: 'muted',
            },
          ],
          width: 40,
          ctx,
        }),
      },
      {
        id: 'rollout-review',
        label: 'Rollout review',
        description: 'Inspector rhythm stays useful for operational review without turning into a second page.',
        render: ({ ctx }) => inspector({
          title: 'active rollout',
          currentValue: 'canary-eu-west',
          supportingText: 'Watching the currently selected rollout slice before promotion.',
          sections: [
            { title: 'Health', content: 'Stable • 0 failed checks' },
            { title: 'ETA', content: '8 minutes remaining' },
            {
              title: 'Description',
              content: 'Use the inspector for concise sidecar context, not a full operational dashboard.',
              tone: 'muted',
            },
          ],
          width: 42,
          ctx,
        }),
      },
    ],
    source: {
      examplePath: 'examples/app-frame/main.ts',
      snippetLabel: 'Inspector side panel',
    },
    tags: ['structure', 'inspection', 'side-panel'],
  },
  {
    kind: 'component',
    id: 'explainability',
    coverageFamilyIds: ['explainability-walkthroughs'],
    family: 'Structural grouping and inspection',
    title: 'explainability()',
    package: 'bijou',
    docs: {
      summary: 'Calm guided recommendation surface for AI-mediated or machine-assisted output that must make provenance, evidence, and next action explicit.',
      useWhen: [
        'A recommendation needs visible provenance and a clear next action instead of a vague summary card.',
        'Rationale and supporting evidence need to stay distinct from the recommendation itself.',
        'The app needs one honest explainability surface rather than a whole wizard or inspector.',
      ],
      avoidWhen: [
        'The content is just a generic note or status with no evidence-backed recommendation.',
        'The user needs a full multi-step flow or editable review workspace.',
        'The surface would be used to hide uncertainty behind authoritative-looking chrome.',
      ],
      relatedFamilies: ['inspector()', 'note()', 'alert()'],
      gracefulLowering: {
        interactive: 'One calm grouped surface keeps provenance, rationale, evidence, and next action visibly distinct.',
        static: 'Single deterministic explainability card preserves the same section rhythm.',
        pipe: 'Labeled text sections keep the recommendation and evidence honest without decorative chrome.',
        accessible: 'Plain linear explanation preserves provenance, evidence, and next action explicitly in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'rollout-recommendation',
        label: 'Rollout recommendation',
        description: 'Guided recommendation with visible evidence and one clear next action.',
        render: ({ width, ctx }) => explainability({
          title: 'Promote the canary build',
          artifactKind: 'Recommendation',
          source: 'Release advisor',
          sourceMode: 'Advisory draft',
          rationale: 'Traffic and error budgets have stayed healthy long enough to make the canary promotion a reviewable next step.',
          evidence: [
            { label: 'Error rate', detail: '0.02% across the last 15 minutes' },
            { label: 'Latency', detail: 'p95 stayed below 110ms in both canary regions' },
            { label: 'Capacity', detail: 'queue depth remained under 12 during peak traffic' },
          ],
          nextAction: 'Promote the canary ring to the full production rollout after human review.',
          governance: 'A release owner must confirm the recommendation before production promotion.',
          confidence: 0.86,
          width: Math.max(54, Math.min(width, 72)),
          ctx,
        }),
      },
      {
        id: 'rollback-brief',
        label: 'Rollback brief',
        description: 'Explainability can recommend caution just as clearly as promotion.',
        render: ({ width, ctx }) => explainability({
          title: 'Hold the rollout for another review pass',
          artifactKind: 'Review brief',
          source: 'Incident assistant',
          sourceMode: 'Human-in-the-loop',
          rationale: 'The rollout is mostly healthy, but one region still shows elevated latency that could turn the recommendation premature.',
          evidence: [
            { label: 'eu-west latency', detail: 'p95 is 27ms above the baseline window' },
            { label: 'Error budget', detail: 'still healthy, but trending upward for two intervals' },
          ],
          nextAction: 'Keep the rollout paused and inspect the eu-west cache warmup path.',
          governance: 'Treat this as advisory guidance, not an automatic rollback trigger.',
          confidence: 71,
          width: Math.max(54, Math.min(width, 72)),
          ctx,
        }),
      },
    ],
    tags: ['guidance', 'ai', 'explainability'],
  },
  {
    kind: 'component',
    id: 'separator',
    coverageFamilyIds: ['dividers'],
    family: 'Structural grouping and inspection',
    title: 'separator() / separatorSurface()',
    package: 'bijou',
    docs: {
      summary: 'Section-boundary primitive for marking real transitions without promoting every boundary into a boxed panel.',
      useWhen: [
        'A section break is needed, but full containment would add more chrome than clarity.',
        'A label can name the next section or state more honestly than another repeated heading.',
        'The layout needs calmer rhythm between clusters of related content.',
      ],
      avoidWhen: [
        'The content needs its own grouped region or titled panel; prefer `box()` or `inspector()`.',
        'The dividers would become decorative stripes rather than meaningful structure.',
        'The label would only repeat an already-visible page title.',
      ],
      relatedFamilies: ['box()', 'tabs()', 'breadcrumb()'],
      gracefulLowering: {
        interactive: 'Visual rules and labeled separators mark real boundaries without over-boxing the layout.',
        static: 'Deterministic divider treatment keeps the same section rhythm and labels.',
        pipe: 'Plain text separators or labels preserve the boundary without decorative dependence.',
        accessible: 'Section boundaries stay explicit through labels and reading order, not just visual lines.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'labeled-breaks',
        label: 'Labeled breaks',
        description: 'Labels should name the next section instead of repeating the current page title.',
        render: ({ width, ctx }) => dividerPreview({
          width,
          ctx,
          title: 'release review',
          sections: [
            {
              lines: [
                'Preflight checks are green.',
                mutedText(ctx, 'No blocking migrations or schema locks are active.'),
              ],
            },
            {
              label: 'Promote canaries',
              lines: [
                'Two regions are ready for promotion.',
                mutedText(ctx, 'Use labeled dividers when the boundary itself needs a name.'),
              ],
            },
            {
              label: 'Aftercare',
              lines: [
                'Watch latency for 15 minutes after promotion.',
              ],
            },
          ],
        }),
      },
      {
        id: 'quiet-rhythm',
        label: 'Quiet rhythm',
        description: 'Unlabeled dividers can separate short sibling clusters without turning them into separate boxes.',
        render: ({ width, ctx }) => dividerPreview({
          width,
          ctx,
          title: 'ops checklist',
          sections: [
            {
              lines: ['Confirm deploy window'],
            },
            {
              lines: ['Page the fallback owner'],
            },
            {
              lines: ['Archive the rollout notes'],
            },
          ],
        }),
      },
    ],
    tags: ['structure', 'rhythm', 'dividers'],
  },
  {
    kind: 'component',
    id: 'help-view',
    coverageFamilyIds: ['keybinding-help-and-shell-hints'],
    family: 'Hints and shortcut cues',
    title: 'helpView() / helpShortSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Grouped keyboard reference plus compact shell hint surfaces for keyboard-owned apps that need shortcut discovery without turning every footer into prose.',
      useWhen: [
        'The app is keyboard-owned and the user needs grouped shortcut reference or compact shell hints.',
        'Shortcut discovery should stay distinct from action execution or command search.',
        'Grouped help names can describe jobs like navigation and actions instead of raw input mechanics.',
      ],
      avoidWhen: [
        'The controls are already obvious from context and the help surface would just restate visible labels.',
        'The UI needs discoverable actions or destinations rather than shortcut explanation; prefer the command palette.',
        'The surface is trying to become a general-purpose note or status card.',
      ],
      relatedFamilies: ['kbd()', 'commandPalette()', 'createFramedApp()'],
      gracefulLowering: {
        interactive: 'Compact shell hints and grouped help surfaces stay on the rich TUI path without losing scope or grouping.',
        static: 'Single-frame help snapshots preserve the same grouped reference and shell hint language.',
        pipe: 'Plain text shortcut summaries and grouped help blocks remain readable without rich surface chrome.',
        accessible: 'Help content linearizes into explicit grouped sections with shortcut and action labels kept together.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'shell-hint',
        label: 'Shell hint',
        description: 'Compact footer-style shortcut help stays terse and scoped.',
        render: ({ width, ctx }) => helpPreview({
          width,
          ctx,
          title: 'shell hint',
          mode: 'hint',
        }),
      },
      {
        id: 'grouped-reference',
        label: 'Grouped reference',
        description: 'Full grouped help explains jobs and scope instead of one long hotkey sentence.',
        render: ({ width, ctx }) => helpPreview({
          width,
          ctx,
          title: 'grouped help',
          mode: 'reference',
        }),
      },
    ],
    tags: ['shortcuts', 'help', 'shell'],
  },
  {
    kind: 'component',
    id: 'notification-system',
    coverageFamilyIds: ['notification-system'],
    family: 'Feedback overlays and history',
    title: 'renderNotificationStack() / renderNotificationHistorySurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Shell-owned transient messaging system with stacked live notifications, explicit placement, actions, and archived review history.',
      useWhen: [
        'The app owns transient messaging as a system instead of rendering one ad hoc overlay at a time.',
        'Warnings or follow-up prompts should be reviewable after the moment they first appear.',
        'Placement, stacking, and interruption level materially affect the user experience.',
      ],
      avoidWhen: [
        'The message should remain part of the normal page flow; prefer `alert()` or `note()`.',
        'A single local transient overlay is enough and no archive or routing matters.',
        'The user must stop and decide before continuing; prefer `modal()` or a confirmation flow.',
      ],
      relatedFamilies: ['toast()', 'modal()', 'alert()', 'createFramedApp()'],
      gracefulLowering: {
        interactive: 'Live stacked notifications and archived review remain one system instead of scattered one-off overlays.',
        static: 'Current notifications or a truthful history snapshot stay visible without pretending transient timing still exists.',
        pipe: 'Sequential event text and archived warning/error records preserve the same system meaning in plain text.',
        accessible: 'Current and archived notices linearize with tone, action, and recall made explicit.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'live-stack',
        label: 'Live stack',
        description: 'System-owned stacked notifications can carry one clear next action without turning into mini workflows.',
        render: ({ width, ctx }) => notificationPreview({
          width,
          ctx,
          title: 'notification stack',
          mode: 'stack',
        }),
      },
      {
        id: 'history-review',
        label: 'History review',
        description: 'Archived notices remain reviewable instead of disappearing after the first interruption.',
        render: ({ width, ctx }) => notificationPreview({
          width,
          ctx,
          title: 'notification history',
          mode: 'history',
        }),
      },
    ],
    source: {
      examplePath: 'examples/notifications/main.ts',
      snippetLabel: 'Stacked notifications and archived review',
    },
    tags: ['notifications', 'history', 'shell'],
  },
  {
    kind: 'component',
    id: 'viewport-surface',
    coverageFamilyIds: ['viewport-masking-and-scrollable-inspection-panes'],
    family: 'Masking and overflow',
    title: 'viewportSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Masking wrapper for overflow content that clips a larger surface into a scrollable window without flattening the child first.',
      useWhen: [
        'A pane needs overflow scrolling while preserving structured surface composition.',
        'The child content may be wider or taller than the visible region and should be clipped predictably.',
        'Higher-level widgets like lists, file pickers, and tables need a shared masking primitive.',
      ],
      avoidWhen: [
        'The component needs row-aware semantics beyond simple line clipping; prefer a purpose-built wrapper like `navigableTableSurface()`.',
        'The content is short enough to fit without overflow management.',
        'You are only lowering plain text at the outer boundary; the string helper path is enough there.',
      ],
      relatedFamilies: ['pagerSurface()', 'focusAreaSurface()', 'navigableTableSurface()'],
      gracefulLowering: {
        interactive: 'Rich viewport mask with proportional scrollbar over structured child content.',
        static: 'Single deterministic frame of the same masked region for screenshots and CI.',
        pipe: 'Explicit text lowering at the boundary, usually by rendering one clipped frame.',
        accessible: 'Linear text output with explicit scroll status language when appropriate.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'document',
        label: 'Document',
        description: 'Text-heavy surface clipped through a viewport mask.',
        render: ({ width, ctx }) => viewportPreviewSurface(
          width,
          boxSurface(LONG_DOCUMENT, {
            title: 'release-notes.md',
            width: Math.max(28, width - 1),
            ctx,
          }),
          4,
          ctx,
        ),
      },
      {
        id: 'structured-stack',
        label: 'Structured stack',
        description: 'Nested surface content proving the viewport is a mask, not a text slicer.',
        render: ({ width, ctx }) => viewportPreviewSurface(
          width,
          column([
            boxSurface('Health checks\n\n- db\n- cache\n- queue', {
              title: 'Signals',
              width: Math.max(24, width - 1),
              ctx,
            }),
            spacer(),
            boxSurface('Warnings\n\n- slow migration\n- stale cache', {
              title: 'Review',
              width: Math.max(24, width - 1),
              ctx,
            }),
            spacer(),
            boxSurface('Next steps\n\n- confirm deploy\n- watch rollout', {
              title: 'Actions',
              width: Math.max(24, width - 1),
              ctx,
            }),
          ]),
          3,
          ctx,
        ),
      },
    ],
    tags: ['layout', 'masking', 'scroll'],
  },
  {
    kind: 'component',
    id: 'kbd',
    coverageFamilyIds: ['inline-shortcut-cues'],
    family: 'Hints and shortcut cues',
    title: 'kbd()',
    package: 'bijou',
    docs: {
      summary: 'Inline shortcut cue for local actions that should stay adjacent to the thing they affect.',
      useWhen: [
        'A nearby action needs a compact keyboard reminder.',
        'The shortcut belongs to one local surface, not the whole shell.',
        'The user benefits from inline discoverability without opening full help.',
      ],
      avoidWhen: [
        'You are trying to document the whole app keymap; prefer shell help or a command surface.',
        'The chip would become the main content instead of a supporting cue.',
        'The shortcut is stale or inactive for the current focus region.',
      ],
      relatedFamilies: ['helpView()', 'commandPalette()', 'note()'],
      gracefulLowering: {
        interactive: 'Compact key-chip treatment inline with the surrounding instruction.',
        static: 'Single-frame key cue preserving the same nearby action language.',
        pipe: 'Plain explicit key names inline with the instruction text.',
        accessible: 'Spoken shortcut and action phrased together in plain text.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'local-actions',
        label: 'Local actions',
        description: 'Shortcut cues that stay beside the immediate action instead of moving into shell chrome.',
        render: ({ ctx }) => column([
          line(`${kbd('Enter', { ctx })} Select item`),
          line(`${kbd('Esc', { ctx })} Dismiss panel`),
          line(`${kbd('?', { ctx })} Open help`),
        ]),
      },
      {
        id: 'chords-and-navigation',
        label: 'Chords and navigation',
        description: 'Mixed single keys and chords that still read as one local instruction cluster.',
        render: ({ ctx }) => column([
          line(`${kbd('↑', { ctx })} ${kbd('↓', { ctx })} Browse rows`),
          line(`${kbd('←', { ctx })} ${kbd('→', { ctx })} Switch tabs`),
          line(`${kbd('Cmd', { ctx })} + ${kbd('Shift', { ctx })} + ${kbd('P', { ctx })} Command palette`),
        ]),
      },
    ],
    tags: ['shortcuts', 'inline', 'hints'],
  },
  {
    kind: 'component',
    id: 'transient-app-notifications',
    coverageFamilyIds: ['transient-app-notifications'],
    family: 'Feedback overlays and history',
    title: 'pushNotification() / renderNotificationStack()',
    package: 'bijou-tui',
    docs: {
      summary: 'App-owned transient notification family for live stacked events, tones, actions, and placements before archived review or broader shell routing becomes the main concern.',
      useWhen: [
        'The app owns transient event messaging and placement materially affects interruption level.',
        'A notice may need one clear next action without turning into a mini workflow.',
        'The system should feel richer than one raw toast primitive but does not need the whole review/archive story in the current moment.',
      ],
      avoidWhen: [
        'The content should remain in page flow; prefer `alert()` or `note()`.',
        'One directly composed local overlay is enough; prefer `toast()`.',
        'The user mainly needs chronological recall and archived review; move up to the full notification-system history surfaces.',
      ],
      relatedFamilies: ['toast()', 'notification system', 'modal()'],
      gracefulLowering: {
        interactive: 'Stacked app-owned notices with tones, placement, and optional actions.',
        static: 'Single deterministic live-notice snapshot preserving stacking and tone.',
        pipe: 'Plain chronological event lines with action language kept explicit.',
        accessible: 'Linearized transient notices that preserve action, severity, and ordering without spatial assumptions.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'actionable-live',
        label: 'Actionable live notice',
        description: 'One clear next action stays attached to the live transient event.',
        render: ({ width, ctx }) => transientAppNotificationPreview({
          width,
          ctx,
          title: 'transient notifications',
          mode: 'actionable',
        }),
      },
      {
        id: 'mixed-variants',
        label: 'Mixed live variants',
        description: 'App-owned transient notices can mix inline and toast variants without becoming the history view.',
        render: ({ width, ctx }) => transientAppNotificationPreview({
          width,
          ctx,
          title: 'mixed live notices',
          mode: 'mixed',
        }),
      },
    ],
    source: {
      examplePath: 'examples/notifications/main.ts',
      snippetLabel: 'Live transient notifications',
    },
    tags: ['notifications', 'transient', 'stack'],
  },
  {
    kind: 'component',
    id: 'progressive-disclosure',
    coverageFamilyIds: ['progressive-disclosure'],
    family: 'Navigation and organization',
    title: 'accordion() / interactiveAccordion()',
    package: 'bijou-tui',
    docs: {
      summary: 'Progressive-disclosure family for scanning summaries first and revealing detail only when the user chooses to open a section.',
      useWhen: [
        'Detail is secondary to summary and the user benefits from scanning section headers first.',
        'Expanded content stays tightly related to one summary row.',
        'The same disclosure story should remain honest in pipe, accessible, and rich modes.',
      ],
      avoidWhen: [
        'The sections are really peer destinations; prefer `tabs()`.',
        'The content is always critical and should not be hidden behind disclosure.',
        'The summary rows are too vague to let the user decide what to expand.',
      ],
      relatedFamilies: ['tabs()', 'box()', 'interactiveAccordion()'],
      gracefulLowering: {
        interactive: 'Expandable sections with keyboard-owned focus for richer inspection.',
        static: 'Deterministic disclosure snapshot preserving expanded and collapsed state.',
        pipe: 'Section headings with disclosed content kept plainly visible in text.',
        accessible: 'Section labels and disclosure state remain explicit in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'summary-first',
        label: 'Summary-first disclosure',
        description: 'Static disclosure keeps summary rows scannable before details unfold.',
        render: ({ width, ctx }) => progressiveDisclosurePreview({
          width,
          ctx,
          title: 'release accordion',
          interactive: false,
        }),
      },
      {
        id: 'keyboard-inspection',
        label: 'Keyboard inspection',
        description: 'The TUI path adds focus ownership without changing the semantic disclosure model.',
        render: ({ width, ctx }) => progressiveDisclosurePreview({
          width,
          ctx,
          title: 'interactive disclosure',
          interactive: true,
        }),
      },
    ],
    tags: ['disclosure', 'accordion', 'navigation'],
  },
  {
    kind: 'component',
    id: 'path-and-progress',
    coverageFamilyIds: ['path-and-progress'],
    family: 'Navigation and organization',
    title: 'breadcrumb() / stepper() / paginator()',
    package: 'bijou',
    docs: {
      summary: 'Wayfinding and progress family for showing where the user is, what stage they are in, or how far through a sequence they have moved.',
      useWhen: [
        'The interface needs explicit location, stage, or page-progress context.',
        'A compact path or step summary helps review, recovery, or coordination.',
        'The user should understand current position without opening another navigation surface.',
      ],
      avoidWhen: [
        'Peer switching is the main job; prefer `tabs()`.',
        'The path is decorative and does not materially orient the user.',
        'Dense explanatory prose is doing the work instead of clear path labels.',
      ],
      relatedFamilies: ['tabs()', 'wizard()', 'statusBarSurface()'],
      gracefulLowering: {
        interactive: 'Visible path, stage, or page state stays compact and scannable.',
        static: 'Single-frame wayfinding and progress snapshots preserve current-state meaning.',
        pipe: 'Plain path and step summaries remain readable without styling.',
        accessible: 'Current location, order, and active stage are stated explicitly in text.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'wayfinding',
        label: 'Wayfinding',
        description: 'Breadcrumbs and pagination keep location and scale explicit.',
        render: ({ width, ctx }) => pathAndProgressPreview({
          width,
          ctx,
          title: 'wayfinding',
          mode: 'wayfinding',
        }),
      },
      {
        id: 'rollout-steps',
        label: 'Rollout steps',
        description: 'A stepper clarifies staged progress when the current stage matters more than peer switching.',
        render: ({ width, ctx }) => pathAndProgressPreview({
          width,
          ctx,
          title: 'rollout path',
          mode: 'rollout',
        }),
      },
    ],
    tags: ['wayfinding', 'progress', 'navigation'],
  },
  {
    kind: 'component',
    id: 'expressive-branding',
    coverageFamilyIds: ['expressive-branding-and-decorative-emphasis'],
    family: 'Branding, motion, and authoring',
    title: 'loadRandomLogo() / gradientText()',
    package: 'bijou',
    docs: {
      summary: 'Expressive branding family for rare logo and gradient emphasis moments that add atmosphere without becoming routine application chrome.',
      useWhen: [
        'A splash, landing, or documentation moment benefits from deliberate brand voice or celebration.',
        'The emphasized text is non-critical and can fall back cleanly in constrained modes.',
        'The decoration opens or punctuates the experience instead of dominating everyday work.',
      ],
      avoidWhen: [
        'Critical status, navigation, or instructions depend on decorative treatment.',
        'The interface is already busy and another branded flourish would compete with the task.',
        'The same text must remain equally plain and scannable in every mode.',
      ],
      relatedFamilies: ['canvas()', 'markdown()', 'box()'],
      gracefulLowering: {
        interactive: 'Logo and gradient emphasis create atmosphere without owning the whole interface.',
        static: 'Expressive emphasis remains visible in one deterministic frame.',
        pipe: 'Plain text remains fully meaningful without pretending decorative color still exists.',
        accessible: 'Text content stays explicit and decorative output does not pollute reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'launch-moment',
        label: 'Launch moment',
        description: 'Brand treatment can open a docs or splash surface, then get out of the way.',
        render: ({ width, ctx }) => brandingPreview({
          width,
          ctx,
          title: 'launch moment',
          mode: 'launch',
        }),
      },
      {
        id: 'celebratory-heading',
        label: 'Celebratory heading',
        description: 'Short gradient emphasis works best as a rare heading-level accent.',
        render: ({ width, ctx }) => brandingPreview({
          width,
          ctx,
          title: 'celebratory heading',
          mode: 'heading',
        }),
      },
    ],
    tags: ['branding', 'gradient', 'logo'],
  },
  {
    kind: 'component',
    id: 'mode-aware-custom-primitives',
    coverageFamilyIds: ['mode-aware-custom-primitives'],
    family: 'Branding, motion, and authoring',
    title: 'renderByMode()',
    package: 'bijou',
    docs: {
      summary: 'Authoring seam for app-defined primitives that keep one semantic meaning while lowering honestly across interactive, pipe, and accessible modes.',
      useWhen: [
        'The app needs a domain-specific primitive that does not belong in shared Bijou componentry.',
        'The same concept must remain truthful across modes without inventing different behaviors per branch.',
        'You are authoring one semantic thing first and then describing its honest lowerings.',
      ],
      avoidWhen: [
        'A shipped Bijou family already matches the job.',
        'The branching only exists for cosmetic novelty instead of semantic truth.',
        'The accessible or pipe branch would hide meaning that the rich branch relies on.',
      ],
      relatedFamilies: ['note()', 'badge()', 'markdown()'],
      gracefulLowering: {
        interactive: 'The richest honest rendering can use styling and composition without losing the underlying semantic meaning.',
        static: 'The same authored primitive remains visible in a deterministic single frame.',
        pipe: 'The primitive lowers to explicit text instead of silent style loss.',
        accessible: 'The same semantic thing is linearized into plain language without decorative assumptions.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'deployment-spark',
        label: 'Deployment spark',
        description: 'One app-owned primitive can keep the same meaning while changing representation by mode.',
        render: ({ width, ctx }) => customPrimitivePreview({
          width,
          ctx,
          title: 'custom primitive',
        }),
      },
    ],
    tags: ['authoring', 'custom', 'lowering'],
  },
  {
    kind: 'component',
    id: 'dense-comparison',
    coverageFamilyIds: ['dense-comparison'],
    family: 'Data and browsing',
    title: 'table() / navigableTableSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Dense comparison family for row-and-column inspection when the main task is comparing attributes across records instead of reading a narrative list.',
      useWhen: [
        'Row and column comparison is the main job.',
        'Headers describe comparable attributes and the table remains compact enough to stay readable.',
        'Keyboard-owned row inspection materially helps the task.',
      ],
      avoidWhen: [
        'Hierarchy or dependencies dominate the meaning; prefer `tree()` or `dag()`.',
        'The data is really one-dimensional and should read like a list.',
        'The rows wrap so heavily that comparison stops being honest.',
      ],
      relatedFamilies: ['browsableListSurface()', 'tree()', 'navigableTableSurface()'],
      gracefulLowering: {
        interactive: 'Passive or keyboard-owned table inspection preserves headers and row focus.',
        static: 'Single-frame dense comparison remains visible where width allows.',
        pipe: 'Plain textual row and column output keeps comparison semantics explicit.',
        accessible: 'Headers, row labels, and focused comparison state remain clear in text.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'passive-grid',
        label: 'Passive grid',
        description: 'A compact data table remains the honest view when comparison, not interaction, is primary.',
        render: ({ width, ctx }) => denseComparisonPreview({
          width,
          ctx,
          title: 'passive table',
          mode: 'passive',
        }),
      },
      {
        id: 'focused-inspection',
        label: 'Focused inspection',
        description: 'The TUI path adds row-aware focus without collapsing the table into a generic list.',
        render: ({ width, ctx }) => denseComparisonPreview({
          width,
          ctx,
          title: 'focused table',
          mode: 'navigable',
        }),
      },
    ],
    tags: ['table', 'comparison', 'data'],
  },
  {
    kind: 'component',
    id: 'hierarchy',
    coverageFamilyIds: ['hierarchy'],
    family: 'Data and browsing',
    title: 'tree() / filePickerSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Hierarchy family for parent-child structure and filesystem-style browsing where nesting, path context, and directory boundaries matter more than tabular comparison.',
      useWhen: [
        'Parent-child nesting is the mental model.',
        'Path context or directory/file distinction helps the user orient themselves.',
        'The hierarchy should still read honestly when flattened into text.',
      ],
      avoidWhen: [
        'Multiple parents or causal dependencies dominate; prefer `dag()`.',
        'The user is comparing attributes across peers; prefer `table()`.',
        'The content is really a linear list with no nesting benefit.',
      ],
      relatedFamilies: ['browsableListSurface()', 'dag()', 'filePickerSurface()'],
      gracefulLowering: {
        interactive: 'Nested structure and file-browser snapshots preserve parent-child meaning.',
        static: 'A deterministic hierarchy frame still communicates nesting and path context.',
        pipe: 'Indented textual hierarchy remains natural and honest.',
        accessible: 'Parent-child relationships stay explicit in reading order.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'project-tree',
        label: 'Project tree',
        description: 'A passive hierarchy is enough when the user is understanding shape and ownership.',
        render: ({ width, ctx }) => hierarchyPreview({
          width,
          ctx,
          title: 'project hierarchy',
          mode: 'tree',
        }),
      },
      {
        id: 'file-browser',
        label: 'File browser snapshot',
        description: 'A file-picker view adds path and directory semantics on the rich TUI path.',
        render: ({ width, ctx }) => hierarchyPreview({
          width,
          ctx,
          title: 'file picker',
          mode: 'picker',
        }),
      },
    ],
    tags: ['hierarchy', 'tree', 'filesystem'],
  },
  {
    kind: 'component',
    id: 'lists-for-exploration',
    coverageFamilyIds: ['lists-for-exploration'],
    family: 'Data and browsing',
    title: 'enumeratedList() / browsableListSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Exploration-list family for one-dimensional scanning where item order and focused inspection matter more than columns or hierarchy.',
      useWhen: [
        'The content is fundamentally a list, not a table or tree.',
        'The first distinguishing label should lead each row or item.',
        'Keyboard browsing materially helps the user inspect records or destinations.',
      ],
      avoidWhen: [
        'Columns carry the meaning; prefer `table()`.',
        'Parent-child nesting matters; prefer `tree()`.',
        'The user is executing commands rather than exploring records; prefer `commandPaletteSurface()`.',
      ],
      relatedFamilies: ['table()', 'tree()', 'commandPaletteSurface()'],
      gracefulLowering: {
        interactive: 'Browsable list rows preserve active selection and optional descriptions.',
        static: 'Ordered list snapshots remain readable without active keyboard focus.',
        pipe: 'Plain list text keeps order and labels explicit.',
        accessible: 'Selection, order, and descriptions remain explicit in linear text.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'ordered-outline',
        label: 'Ordered outline',
        description: 'A passive list is enough when the task is scan-first review.',
        render: ({ width, ctx }) => explorationListPreview({
          width,
          ctx,
          title: 'ordered outline',
          mode: 'enumerated',
        }),
      },
      {
        id: 'browsable-records',
        label: 'Browsable records',
        description: 'The TUI path adds row focus and descriptions without pretending the content is a command palette.',
        render: ({ width, ctx }) => explorationListPreview({
          width,
          ctx,
          title: 'browsable records',
          mode: 'browsable',
        }),
      },
    ],
    tags: ['list', 'browsing', 'exploration'],
  },
  {
    kind: 'component',
    id: 'temporal-or-dependency-views',
    coverageFamilyIds: ['temporal-or-dependency-views'],
    family: 'Data and browsing',
    title: 'timeline() / dag()',
    package: 'bijou',
    docs: {
      summary: 'Temporal and dependency family for explaining what happened next or what depends on what when order or causality is the real structure.',
      useWhen: [
        'Chronology or dependency is the actual organizing principle.',
        'The user needs to follow sequence or causal structure, not just compare rows.',
        'A summary metric alone would hide the important relationship between events or nodes.',
      ],
      avoidWhen: [
        'A plain table or tree answers the question more directly.',
        'The graph is decorative wallpaper instead of meaningful structure.',
        'The content has only one parent and is mainly consumed as sequence; a timeline or tree may be clearer than a DAG.',
      ],
      relatedFamilies: ['table()', 'tree()', 'log()'],
      gracefulLowering: {
        interactive: 'Chronological or dependency structure stays visible as the main story.',
        static: 'A deterministic frame preserves order or causal relationships honestly.',
        pipe: 'Ordered event lines or dependency traces keep the same semantic meaning in plain text.',
        accessible: 'Temporal or causal relationships remain explicit without relying on shape alone.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'release-timeline',
        label: 'Release timeline',
        description: 'Chronology is the right frame when the question is what happened next.',
        render: ({ width, ctx }) => temporalPreview({
          width,
          ctx,
          title: 'release timeline',
          mode: 'timeline',
        }),
      },
      {
        id: 'dependency-graph',
        label: 'Dependency graph',
        description: 'Dependency structure matters when readiness depends on upstream steps.',
        render: ({ width, ctx }) => temporalPreview({
          width,
          ctx,
          title: 'dependency graph',
          mode: 'dag',
        }),
      },
    ],
    tags: ['timeline', 'dag', 'dependency'],
  },
  {
    kind: 'component',
    id: 'motion-and-shader-effects',
    coverageFamilyIds: ['motion-and-shader-effects'],
    family: 'Branding, motion, and authoring',
    title: 'canvas()',
    package: 'bijou-tui',
    docs: {
      summary: 'Motion and shader family for deliberate visual emphasis, transitions, and animated atmosphere when the effect reinforces state change or product voice instead of competing with the task.',
      useWhen: [
        'Motion or shader output materially clarifies a transition, state change, or atmosphere.',
        'The effect has an honest reduced-motion or static fallback.',
        'The visual moment is deliberate and bounded instead of routine chrome noise.',
      ],
      avoidWhen: [
        'The effect is only decorative and distracts from the task.',
        'Readability or scanning would be harmed by the animation.',
        'A stable status cue would communicate the meaning more directly.',
      ],
      relatedFamilies: ['gradientText()', 'createFramedApp()', 'notification system'],
      gracefulLowering: {
        interactive: 'Shader-driven or animated surfaces reinforce state change or atmosphere deliberately.',
        static: 'The final visual state remains truthful without pretending motion still exists.',
        pipe: 'Decorative effects disappear and the meaning-bearing content remains.',
        accessible: 'State-change meaning stays explicit without requiring visual motion.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'shader-wave',
        label: 'Shader wave',
        description: 'A low-key animated field can reinforce atmosphere when it stays subordinate to the content.',
        render: ({ width, ctx, timeMs }) => motionPreview({
          width,
          ctx,
          title: 'shader wave',
          mode: 'wave',
          timeMs,
        }),
      },
      {
        id: 'braille-field',
        label: 'Braille field',
        description: 'Higher-resolution shader output still needs an honest non-motion fallback.',
        render: ({ width, ctx, timeMs }) => motionPreview({
          width,
          ctx,
          title: 'braille field',
          mode: 'braille',
          timeMs,
        }),
      },
    ],
    tags: ['motion', 'shader', 'canvas'],
  },
  {
    kind: 'component',
    id: 'app-shell',
    coverageFamilyIds: ['app-shell'],
    family: 'Shell and workspace',
    title: 'createFramedApp() / statusBarSurface() / commandPaletteSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'App-shell family for multi-view framed applications with global status, command discovery, overlays, and consistent shell-owned chrome.',
      useWhen: [
        'The app has multiple pages, overlays, or global shell concerns.',
        'Status context and action discovery should stay distinct from in-page content.',
        'The shell needs to frame workspace state without becoming a dumping ground for unrelated metadata.',
      ],
      avoidWhen: [
        'The app is really a single screen or one prompt.',
        'Status bars or command palettes would only duplicate obvious local labels.',
        'The surface needs record browsing rather than action discovery; prefer `browsableListSurface()`.',
      ],
      relatedFamilies: ['statusBarSurface()', 'helpViewSurface()', 'commandPaletteSurface()', 'tabs()'],
      gracefulLowering: {
        interactive: 'Full shell chrome keeps status, navigation, and command discovery distinct from page content.',
        static: 'The active page and essential shell context remain visible in one deterministic frame.',
        pipe: 'Current page content plus minimal shell context stays readable without pretending background interactivity exists.',
        accessible: 'Shell state, overlays, and active context linearize into one readable flow.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'framed-page',
        label: 'Framed page',
        description: 'Status rails and framed page content create calm global context around the current workspace.',
        render: ({ width, ctx }) => appShellPreview({
          width,
          ctx,
          title: 'framed shell',
          mode: 'shell',
        }),
      },
      {
        id: 'command-discovery',
        label: 'Command discovery',
        description: 'The palette should surface actions and destinations, not become a record browser in disguise.',
        render: ({ width, ctx }) => appShellPreview({
          width,
          ctx,
          title: 'command palette',
          mode: 'palette',
        }),
      },
    ],
    source: {
      examplePath: 'examples/app-frame/main.ts',
      snippetLabel: 'Framed app shell',
    },
    tags: ['shell', 'status-bar', 'command-palette'],
  },
  {
    kind: 'component',
    id: 'workspace-layout',
    coverageFamilyIds: ['workspace-layout'],
    family: 'Shell and workspace',
    title: 'splitPaneSurface() / gridSurface()',
    package: 'bijou-tui',
    docs: {
      summary: 'Workspace-layout family for honest spatial composition when simultaneous context materially helps the task and sequential flow would hide important relationships.',
      useWhen: [
        'Spatial arrangement materially helps the task.',
        'Primary and secondary regions should stay visible together.',
        'The regions already have meaningful jobs and are not just geometry for its own sake.',
      ],
      avoidWhen: [
        'A sequential flow would be simpler and more legible.',
        'The borders only expose layout math instead of region purpose.',
        'The same meaning would be clearer as one focused pane.',
      ],
      relatedFamilies: ['createFramedApp()', 'box()', 'focusAreaSurface()'],
      gracefulLowering: {
        interactive: 'Spatial relationships stay visible through split and grid composition.',
        static: 'A deterministic layout snapshot preserves region jobs without fake interactivity.',
        pipe: 'Regions lower to a sensible sequential reading order.',
        accessible: 'Labeled regions linearize predictably without losing section identity.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'split-context',
        label: 'Split context',
        description: 'A split keeps primary work and secondary context visible at once.',
        render: ({ width, ctx }) => workspaceLayoutPreview({
          width,
          ctx,
          title: 'split workspace',
          mode: 'split',
        }),
      },
      {
        id: 'dashboard-grid',
        label: 'Dashboard grid',
        description: 'A grid is honest when multiple stable regions deserve simultaneous visibility.',
        render: ({ width, ctx }) => workspaceLayoutPreview({
          width,
          ctx,
          title: 'grid workspace',
          mode: 'grid',
        }),
      },
    ],
    tags: ['layout', 'split', 'grid'],
  },

  // ── Data visualization ──────────────────────────────────────────

  {
    kind: 'component',
    id: 'sparkline',
    coverageFamilyIds: ['data-visualization'],
    family: 'Data visualization',
    title: 'sparkline()',
    package: 'bijou',
    docs: {
      summary: 'Compact inline trend graph using Unicode block characters — a glanceable shape next to a label instead of a number alone.',
      useWhen: [
        'A numeric trend is more informative than the latest scalar value.',
        'The graph must fit inline beside a label or inside a table cell.',
        'You have a rolling window of 8–60 samples and need instant visual context.',
      ],
      avoidWhen: [
        'The user needs exact numeric values — use a table or formatted number.',
        'The data needs area-chart density or sub-pixel smoothness — use brailleChartSurface().',
        'The visualization is decorative and does not change decision-making.',
      ],
      relatedFamilies: ['brailleChartSurface()', 'statsPanelSurface()', 'progressBar()'],
      gracefulLowering: {
        interactive: 'Unicode block characters (▁▂▃▄▅▆▇█) with optional semantic color.',
        static: 'Same block rendering, no animation.',
        pipe: 'Numeric CSV or min/avg/max summary.',
        accessible: 'Spoken trend summary like "rising from 2 to 8 over 10 samples".',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'basic',
        label: 'Basic trend',
        description: 'Raw block-character rendering of a short time series.',
        render: ({ ctx }) => sparkline([1, 5, 3, 8, 2, 7, 4, 6, 9, 3], { ctx }),
      },
      {
        id: 'fixed-width',
        label: 'Fixed width',
        description: 'Values resampled to fit a specific character width.',
        render: ({ width, ctx }) => sparkline(
          [10, 20, 15, 40, 35, 25, 30, 50, 45, 20, 10, 30, 60, 55, 40],
          { width: Math.max(8, width - 4), ctx },
        ),
      },
      {
        id: 'explicit-range',
        label: 'Explicit min/max',
        description: 'Fixed axis bounds for stable cross-comparison.',
        render: ({ ctx }) => sparkline([3, 5, 4, 6, 5, 7], { min: 0, max: 10, ctx }),
      },
    ],
    tags: ['visualization', 'inline', 'trend'],
  },
  {
    kind: 'component',
    id: 'braille-chart',
    coverageFamilyIds: ['data-visualization'],
    family: 'Data visualization',
    title: 'brailleChartSurface()',
    package: 'bijou',
    docs: {
      summary: 'High-density filled area chart using Unicode Braille characters — 2×4 sub-pixel resolution per terminal cell for smooth curves in tight space.',
      useWhen: [
        'The data deserves area-chart density and sub-pixel smoothness.',
        'A filled shape conveys volume or magnitude better than a line.',
        'You need a chart in a fixed region (e.g. dashboard pane or overlay).',
      ],
      avoidWhen: [
        'A sparkline is sufficient and width is critical — use sparkline().',
        'Exact numeric values must be readable from the chart — use a table.',
        'The terminal may not support Unicode Braille rendering.',
      ],
      relatedFamilies: ['sparkline()', 'statsPanelSurface()', 'perfOverlaySurface()'],
      gracefulLowering: {
        interactive: 'Braille-dot area chart with semantic color tokens.',
        static: 'Same Braille rendering, no animation.',
        pipe: 'Numeric summary table (min, max, mean, samples).',
        accessible: 'Spoken range and trend description.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'basic',
        label: 'Basic area chart',
        description: 'Auto-scaled filled area chart.',
        render: ({ width, ctx }) => brailleChartSurface(
          [1, 4, 2, 8, 5, 7, 3, 9, 6, 4, 2, 5, 8, 7, 3, 6, 9, 5, 2, 4],
          { width: Math.max(10, width - 4), height: 6, ctx },
        ),
      },
      {
        id: 'explicit-range',
        label: 'Explicit min/max',
        description: 'Fixed axis range for stable comparison across variants.',
        render: ({ width, ctx }) => brailleChartSurface(
          [1, 4, 2, 8, 5, 7, 3, 9, 6, 4, 2, 5, 8, 7, 3, 6, 9, 5, 2, 4],
          { width: Math.max(10, width - 4), height: 6, min: 0, max: 10, ctx },
        ),
      },
    ],
    tags: ['visualization', 'chart', 'braille', 'time-series'],
  },
  {
    kind: 'component',
    id: 'stats-panel',
    coverageFamilyIds: ['data-visualization'],
    family: 'Data visualization',
    title: 'statsPanelSurface()',
    package: 'bijou',
    docs: {
      summary: 'Titled bordered panel with aligned key-value metric rows and optional inline sparklines — the go-to component for labeled metric groups.',
      useWhen: [
        'Multiple named metrics belong together in one titled region.',
        'Key-value alignment improves scannability over free-form text.',
        'Inline sparklines beside values would give trend context without a separate chart.',
      ],
      avoidWhen: [
        'A single metric does not warrant a bordered panel — use a label and value inline.',
        'The metrics need interactive drill-down or filtering — use navigableTable().',
        'The data is tabular with many columns — use table().',
      ],
      relatedFamilies: ['sparkline()', 'perfOverlaySurface()', 'table()', 'box()'],
      gracefulLowering: {
        interactive: 'Bordered box with aligned labels, values, and sparklines.',
        static: 'Same bordered layout, single-frame snapshot.',
        pipe: 'Key: value lines, one per row.',
        accessible: 'Labeled metric list read sequentially.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'basic',
        label: 'Basic metrics',
        description: 'Labeled key-value rows in a titled box.',
        render: ({ width, ctx }) => statsPanelSurface([
          { label: 'FPS', value: '60' },
          { label: 'frame time', value: '16.7 ms' },
          { label: 'heap', value: '42.1 MB' },
          { label: 'rss', value: '128 MB' },
        ], { title: 'Runtime', width: Math.min(36, Math.max(24, width - 4)), ctx }),
      },
      {
        id: 'with-sparklines',
        label: 'Inline sparklines',
        description: 'Sparkline trails after each value give rolling trend context.',
        render: ({ width, ctx }) => statsPanelSurface([
          { label: 'FPS', value: '58', sparkline: [55, 60, 58, 62, 57, 60, 58, 61] },
          { label: 'frame', value: '17.2 ms', sparkline: [18, 16, 17, 15, 18, 17, 16, 17] },
          { label: 'heap', value: '42 MB', sparkline: [38, 40, 42, 41, 43, 42, 40, 42] },
        ], { title: 'Perf', width: Math.min(44, Math.max(30, width - 4)), ctx }),
      },
    ],
    tags: ['visualization', 'metrics', 'panel', 'dashboard'],
  },
  {
    kind: 'component',
    id: 'perf-overlay',
    coverageFamilyIds: ['data-visualization'],
    family: 'Data visualization',
    title: 'perfOverlaySurface()',
    package: 'bijou',
    docs: {
      summary: 'Prebuilt FPS + memory dashboard composing statsPanelSurface and brailleChartSurface — drop-in performance overlay for any app.',
      useWhen: [
        'You need a ready-made FPS and memory dashboard without wiring stats and charts manually.',
        'A performance overlay should be blittable onto an existing app surface.',
        'The app tracks frame time history and wants a chart alongside numeric metrics.',
      ],
      avoidWhen: [
        'The metrics are domain-specific rather than runtime performance — use statsPanelSurface() directly.',
        'You need a custom chart layout that does not match the stats-on-top chart-below pattern.',
        'The overlay is permanent and would obstruct primary content — reconsider placement.',
      ],
      relatedFamilies: ['statsPanelSurface()', 'brailleChartSurface()', 'sparkline()'],
      gracefulLowering: {
        interactive: 'Stats panel with braille area chart, semantic color tokens.',
        static: 'Same panel and chart layout, single-frame snapshot.',
        pipe: 'FPS/memory lines as plain key-value output.',
        accessible: 'Spoken metric summary: FPS, frame time, memory usage.',
      },
    },
    profilePresets: CANONICAL_STORY_PROFILE_PRESETS,
    variants: [
      {
        id: 'basic',
        label: 'Standard overlay',
        description: 'FPS, frame time, and memory with a braille frame-time chart.',
        render: ({ ctx }) => perfOverlaySurface({
          fps: 60,
          frameTimeMs: 16.7,
          frameTimeHistory: [18, 16, 17, 15, 18, 17, 16, 17, 15, 16, 18, 17, 16, 15, 17, 16],
          width: 120,
          height: 40,
          heapUsedMB: 42.1,
          rssMB: 128,
        }, { ctx }),
      },
      {
        id: 'no-chart',
        label: 'Stats only',
        description: 'Compact panel without the braille chart for tight spaces.',
        render: ({ ctx }) => perfOverlaySurface({
          fps: 30,
          frameTimeMs: 33.3,
          width: 80,
          height: 24,
          heapUsedMB: 64.2,
        }, { showChart: false, ctx }),
      },
    ],
    tags: ['visualization', 'performance', 'overlay', 'dashboard'],
  },
] as const;

export function findComponentStory(id: string): ComponentStory | undefined {
  return COMPONENT_STORIES.find((story) => story.id === id);
}
