import type { BijouContext } from '../../packages/bijou/src/index.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import { dogfoodLocalizedText } from './localization.js';

export const DOGFOOD_TERMINAL_NOTICE = dogfoodTerminalNotice();

export const DOGFOOD_NON_INTERACTIVE_MESSAGE = dogfoodNonInteractiveMessage();

export function dogfoodTerminalNotice(localization?: LocalizationPort): string {
  return [
    dogfoodText(localization, 'terminal.notice.start', 'Starting DOGFOOD, a full-screen interactive TUI.'),
    dogfoodText(localization, 'terminal.notice.exitControls', 'Exit controls: press q to open quit confirmation, y to confirm, n to cancel, or Ctrl-C to hard-exit.'),
  ].join('\n') + '\n';
}

export function dogfoodNonInteractiveMessage(localization?: LocalizationPort): string {
  return [
    dogfoodText(localization, 'terminal.nonInteractive.requiresTty', 'DOGFOOD requires an interactive terminal with both stdin and stdout attached to a TTY.'),
    dogfoodText(localization, 'terminal.nonInteractive.runCommand', 'Run `npm run dogfood` in a terminal emulator, not through a shell pipeline, redirect, or non-interactive task runner.'),
    dogfoodText(localization, 'terminal.nonInteractive.scriptedVerification', 'For scripted verification, use `npm run smoke:dogfood`.'),
  ].join('\n') + '\n';
}

export function dogfoodTerminalReadiness(
  ctx: Pick<BijouContext, 'runtime'>,
  localization?: LocalizationPort,
): { ok: true } | { ok: false; message: string } {
  if (!ctx.runtime.stdoutIsTTY || !ctx.runtime.stdinIsTTY) {
    return { ok: false, message: dogfoodNonInteractiveMessage(localization) };
  }
  return { ok: true };
}

function dogfoodText(localization: LocalizationPort | undefined, id: string, fallback: string): string {
  return dogfoodLocalizedText(localization, id, fallback);
}
