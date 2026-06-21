import type { StartAppOptions } from './index.js';
import { stringToSurface } from '@flyingrobots/bijou';
import type { Surface, Theme } from '@flyingrobots/bijou';

type Opts<M> = StartAppOptions<M>;

function textSurface(text: string): Surface {
  const lines = text.split('\n');
  return stringToSurface(text, Math.max(1, ...lines.map((line) => line.length)), Math.max(1, lines.length));
}

function makeTheme(name: string, primaryHex: string, primaryBg: string, accentHex = '#c084fc'): Theme {
  return {
    name,
    status: {
      success: { hex: '#22c55e' },
      error: { hex: '#ef4444' },
      warning: { hex: '#f59e0b' },
      info: { hex: '#38bdf8' },
      pending: { hex: '#64748b', modifiers: ['dim'] },
      active: { hex: '#38bdf8' },
      muted: { hex: '#64748b', modifiers: ['dim', 'strikethrough'] },
    },
    semantic: {
      success: { hex: '#22c55e' },
      error: { hex: '#ef4444' },
      warning: { hex: '#f59e0b' },
      info: { hex: '#38bdf8' },
      accent: { hex: accentHex },
      muted: { hex: '#94a3b8', modifiers: ['dim'] },
      primary: { hex: primaryHex, modifiers: ['bold'] },
    },
    gradient: {
      brand: [
        { pos: 0, color: [56, 189, 248] },
        { pos: 1, color: [192, 132, 252] },
      ],
      progress: [
        { pos: 0, color: [34, 197, 94] },
        { pos: 1, color: [56, 189, 248] },
      ],
    },
    border: {
      primary: { hex: '#38bdf8' },
      secondary: { hex: accentHex },
      success: { hex: '#22c55e' },
      warning: { hex: '#f59e0b' },
      error: { hex: '#ef4444' },
      muted: { hex: '#64748b' },
    },
    ui: {
      cursor: { hex: '#38bdf8' },
      focusGutter: { hex: accentHex },
      scrollThumb: { hex: '#38bdf8' },
      scrollTrack: { hex: '#334155' },
      sectionHeader: { hex: primaryHex, modifiers: ['bold'] },
      logo: { hex: '#38bdf8' },
      tableHeader: { hex: primaryHex },
      trackEmpty: { hex: '#1e293b' },
    },
    surface: {
      primary: { hex: primaryHex, bg: primaryBg },
      secondary: { hex: '#e2e8f0', bg: '#1e293b' },
      elevated: { hex: primaryHex, bg: '#334155' },
      overlay: { hex: primaryHex, bg: primaryBg },
      muted: { hex: '#94a3b8', bg: '#020617' },
    },
  };
}

const TEST_THEME: Theme = makeTheme('test-theme', '#f8fafc', '#0f172a');

const LIGHT_THEME: Theme = makeTheme('light-theme', '#0f172a', '#f8fafc', '#2563eb');

const DARK_THEME: Theme = makeTheme('dark-theme', '#f8fafc', '#020617', '#c084fc');

const TEST_THEME_SET = [
  { id: 'light', theme: LIGHT_THEME },
  { id: 'dark', theme: DARK_THEME },
] as const;

const CUSTOM_ID_THEME_SET = [
  { id: 'sunrise', scheme: 'light' as const, theme: LIGHT_THEME },
  { id: 'midnight', scheme: 'dark' as const, theme: DARK_THEME },
] as const;

function withStdoutSize<T>(columns: number | undefined, rows: number | undefined, runTest: () => T): T {
  const originalColumns = process.stdout.columns;
  const originalRows = process.stdout.rows;
  Object.defineProperty(process.stdout, 'columns', { configurable: true, value: columns });
  Object.defineProperty(process.stdout, 'rows', { configurable: true, value: rows });
  try {
    return runTest();
  } finally {
    Object.defineProperty(process.stdout, 'columns', { configurable: true, value: originalColumns });
    Object.defineProperty(process.stdout, 'rows', { configurable: true, value: originalRows });
  }
}

export {
  CUSTOM_ID_THEME_SET,
  DARK_THEME,
  LIGHT_THEME,
  makeTheme,
  TEST_THEME,
  TEST_THEME_SET,
  textSurface,
  withStdoutSize,
};

export type { Opts };
