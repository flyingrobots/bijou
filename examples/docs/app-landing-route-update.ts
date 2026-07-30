import type { BijouContext } from '../../packages/bijou/src/index.js';
import {
  isKeyMsg,
  isShellQuitConfirmAccept,
  isShellQuitConfirmDismiss,
  isShellQuitRequest,
  quit,
  shouldUseShellQuitConfirm,
  type Cmd,
  type FramedAppMsg,
  type KeyMsg,
  type MouseMsg,
  type ResizeMsg,
} from '../../packages/bijou-tui/src/index.js';
import { isPulseMsg } from '../../packages/bijou-tui/src/runtime-messages.js';
import type { LocalizationPort } from '../../packages/bijou-i18n/src/index.js';
import {
  LANDING_THEME_COUNT,
  nextLandingQualityMode,
  nextLandingThemeIndex,
  previousLandingQualityMode,
  resolveLandingQualityMode,
  updateLandingFps,
} from './app-landing.js';
import {
  shouldContinueFromLanding,
  shouldToggleLandingPerfHud,
} from './app-landing-key-policy.js';
import {
  applyLandingQualitySelection,
  applyLandingThemeSelection,
} from './app-docs-model-sync.js';
import type {
  DocsMsg,
  PulseLikeMsg,
  RootModel,
  RootMsg,
} from './app-model.js';

export type RootUpdateResult = [
  RootModel,
  Cmd<RootMsg>[],
];

export type UpdateExplorer = (
  message:
    | FramedAppMsg<DocsMsg>
    | KeyMsg
    | MouseMsg
    | ResizeMsg
    | PulseLikeMsg,
  model: RootModel,
) => RootUpdateResult;

export function updateLandingRoute(
  message:
    | FramedAppMsg<DocsMsg>
    | KeyMsg
    | MouseMsg
    | ResizeMsg
    | PulseLikeMsg,
  model: RootModel,
  context: BijouContext,
  localization: LocalizationPort,
  syncShellThemeContext: (themeId: string | undefined) => void,
  updateExplorer: UpdateExplorer,
): RootUpdateResult {
  if (isPulseMsg(message)) {
    const landingTimeMs =
      model.landingTimeMs + Math.round(message.dt * 1000);
    return [
      {
        ...model,
        landingTimeMs,
        landingFps: updateLandingFps(model.landingFps, message.dt),
        landingToast:
          model.landingToast &&
          landingTimeMs < model.landingToast.expiresAtMs
            ? model.landingToast
            : undefined,
      },
      [],
    ];
  }
  if (!isKeyMsg(message)) return [model, []];
  if (model.landingQuitConfirmOpen) {
    if (isShellQuitConfirmAccept(message)) {
      return [
        { ...model, landingQuitConfirmOpen: false },
        [quit()],
      ];
    }
    if (isShellQuitConfirmDismiss(message)) {
      return [{ ...model, landingQuitConfirmOpen: false }, []];
    }
    return [model, []];
  }
  if (isShellQuitRequest(message)) {
    return shouldUseShellQuitConfirm(context)
      ? [{ ...model, landingQuitConfirmOpen: true }, []]
      : [model, [quit()]];
  }
  if (shouldToggleLandingPerfHud(message)) {
    return updateExplorer(message, model);
  }
  if (message.key === 'left' || message.key === 'right') {
    return [
      applyLandingThemeSelection(
        syncShellThemeContext,
        model,
        nextLandingThemeIndex(
          model.landingThemeIndex,
          message.key === 'left' ? -1 : 1,
        ),
      ),
      [],
    ];
  }
  if (message.key === 'up' || message.key === 'down') {
    const current = resolveLandingQualityMode(model);
    return [
      applyLandingQualitySelection(
        model,
        message.key === 'up'
          ? previousLandingQualityMode(current)
          : nextLandingQualityMode(current),
        localization,
      ),
      [],
    ];
  }
  if (!message.ctrl && !message.alt && /^[1-9]$/.test(message.key)) {
    const themeIndex = Number(message.key) - 1;
    if (themeIndex < LANDING_THEME_COUNT) {
      return [
        applyLandingThemeSelection(
          syncShellThemeContext,
          model,
          themeIndex,
        ),
        [],
      ];
    }
  }
  return shouldContinueFromLanding(message)
    ? [{ ...model, route: 'docs' }, []]
    : [model, []];
}
