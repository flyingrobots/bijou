import type { BlockDefinition, OutputMode } from '@flyingrobots/bijou';

export const s = String;

export const DOGFOOD_BLOCK_PACKAGE = '@flyingrobots/bijou-dogfood';

export const DOGFOOD_BLOCK_MODES: readonly OutputMode[] = Object.freeze(['interactive', 'static', 'pipe', 'accessible']);

export const DOGFOOD_BLOCK_ROLES: readonly DogfoodBlockRole[] = Object.freeze([
  'app-shell',
  'title',
  'navigation',
  'article',
  'search',
  'notifications',
  'diagnostics',
  'help',
  'commands',
  'settings',
  'inspector',
  'preview',
  'footer',
  'workbench',
  'fixture',
]);

export type DogfoodBlockDefinition = BlockDefinition<never>;

export type DogfoodBlockRole =
  | 'app-shell'
  | 'title'
  | 'navigation'
  | 'article'
  | 'search'
  | 'notifications'
  | 'diagnostics'
  | 'help'
  | 'commands'
  | 'settings'
  | 'inspector'
  | 'preview'
  | 'footer'
  | 'workbench'
  | 'fixture';
