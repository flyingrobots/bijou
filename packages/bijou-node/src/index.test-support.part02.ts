import type { Theme } from '@flyingrobots/bijou';

import { TEST_THEME } from './index.test-support.part01.js';

const UNUSED_THEME: Theme = {
  ...TEST_THEME,
  name: 'unused-theme',
};

const LEGACY_TEST_THEME: Theme = {
  name: 'test-theme',
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
    accent: { hex: '#c084fc' },
    muted: { hex: '#94a3b8', modifiers: ['dim'] },
    primary: { hex: '#f8fafc', modifiers: ['bold'] },
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
    secondary: { hex: '#c084fc' },
    success: { hex: '#22c55e' },
    warning: { hex: '#f59e0b' },
    error: { hex: '#ef4444' },
    muted: { hex: '#64748b' },
  },
  ui: {
    cursor: { hex: '#38bdf8' },
    focusGutter: { hex: '#c084fc' },
    scrollThumb: { hex: '#38bdf8' },
    scrollTrack: { hex: '#334155' },
    sectionHeader: { hex: '#f8fafc', modifiers: ['bold'] },
    logo: { hex: '#38bdf8' },
    tableHeader: { hex: '#f8fafc' },
    trackEmpty: { hex: '#1e293b' },
  },
  surface: {
    primary: { hex: '#f8fafc', bg: '#0f172a' },
    secondary: { hex: '#e2e8f0', bg: '#1e293b' },
    elevated: { hex: '#f8fafc', bg: '#334155' },
    overlay: { hex: '#f8fafc', bg: '#0f172a' },
    muted: { hex: '#94a3b8', bg: '#020617' },
  },
};

export { LEGACY_TEST_THEME, UNUSED_THEME };
