import {
  cloneContextWithResolvedTheme,
  resolveSafeCtx,
  setDefaultContext,
  type BijouContext,
} from '@flyingrobots/bijou';
import type { CreateFramedAppOptions } from './app-frame-options.js';
import type { FrameThemeRunSnapshot } from './app-frame-theme-run-contract.js';
import type { ResolvedFrameShellTheme } from './app-frame-overlays.js';
import {
  resolveCurrentShellTheme,
  resolveFrameShellThemeChoices,
  resolveShellThemeForContext,
} from './app-frame-overlays.js';
export class FrameThemeRuntime<PageModel, Msg> {
  readonly specs;
  readonly enableSettings: boolean;
  private defaultContext: BijouContext | undefined;
  private themes: readonly ResolvedFrameShellTheme[] = [];
  private frameContext: BijouContext | undefined;
  private frameContextThemeId: string | undefined;
  private runScoped = false;
  private readonly usesAmbientDefault: boolean;

  constructor(private readonly options: CreateFramedAppOptions<PageModel, Msg>) {
    this.specs = options.shellThemes ?? [];
    this.enableSettings =
      this.specs.length > 1 ||
      this.specs.some((theme) => (theme.modes?.length ?? 0) > 1);
    this.defaultContext = options.ctx ?? resolveSafeCtx();
    this.frameContext = options.ctx;
    this.usesAmbientDefault = options.ctx == null && this.defaultContext != null;
    if (this.frameContext != null) {
      this.ensure(this.frameContext);
      this.frameContextThemeId = resolveShellThemeForContext(
        this.themes,
        this.frameContext,
      )?.id;
    }
  }

  get resolvedThemes(): readonly ResolvedFrameShellTheme[] {
    return this.themes;
  }

  ensure(explicitContext?: BijouContext): void {
    if (this.specs.length === 0 || this.themes.length > 0) return;
    const baseContext =
      explicitContext ??
      this.frameContext ??
      this.options.ctx ??
      resolveSafeCtx();
    if (baseContext == null) {
      throw new Error(
        'createFramedApp: shellThemes requires options.ctx, app.run({ ctx }), or a default Bijou context',
      );
    }
    this.defaultContext ??= baseContext;
    this.themes = resolveFrameShellThemeChoices(
      this.specs,
      this.defaultContext,
    );
  }

  resolveContext(): BijouContext | undefined {
    return this.frameContext ?? this.options.ctx ?? resolveSafeCtx();
  }

  resolveThemeContext(
    activeThemeId: string | undefined,
  ): BijouContext | undefined {
    const baseContext = this.resolveContext();
    this.ensure(baseContext);
    if (this.defaultContext == null) return baseContext;
    const activeTheme = resolveCurrentShellTheme(
      this.themes,
      activeThemeId,
    );
    if (activeTheme == null) return baseContext;
    if (
      this.frameContext != null &&
      this.frameContextThemeId === activeTheme.id
    ) {
      return this.frameContext;
    }
    if (
      resolveShellThemeForContext(this.themes, baseContext)?.id ===
      activeTheme.id
    ) {
      return baseContext;
    }
    return cloneContextWithResolvedTheme(
      this.defaultContext,
      activeTheme.resolvedTheme,
    );
  }

  publish(theme: ResolvedFrameShellTheme): BijouContext | undefined {
    this.ensure(this.resolveContext());
    if (this.defaultContext == null) return this.resolveContext();
    this.frameContext = cloneContextWithResolvedTheme(
      this.defaultContext,
      theme.resolvedTheme,
    );
    this.frameContextThemeId = theme.id;
    if (this.usesAmbientDefault && !this.runScoped) {
      setDefaultContext(this.frameContext);
    }
    this.options.onShellThemeChange?.({
      shellTheme: theme.shellTheme,
      shellThemeSpec: theme.shellThemeSpec,
      shellThemeId: theme.shellThemeId,
      shellThemeLabel: theme.shellThemeLabel,
      modeId: theme.modeId,
      modeLabel: theme.modeLabel,
      ctx: this.frameContext,
    });
    return this.frameContext;
  }

  beginRun(context: BijouContext | undefined): FrameThemeRunSnapshot {
    const snapshot = {
      frameContext: this.frameContext,
      frameContextThemeId: this.frameContextThemeId,
      defaultContext: this.defaultContext,
      resolvedThemes: this.themes,
    };
    if (context != null && this.options.ctx == null) {
      this.runScoped = true;
      this.frameContext = context;
      this.defaultContext = context;
      this.themes = [];
      this.ensure(context);
      this.frameContextThemeId = resolveShellThemeForContext(
        this.themes,
        context,
      )?.id;
    }
    return snapshot;
  }

  endRun(snapshot: FrameThemeRunSnapshot): void {
    this.runScoped = false;
    this.frameContext = snapshot.frameContext;
    this.frameContextThemeId = snapshot.frameContextThemeId;
    this.defaultContext = snapshot.defaultContext;
    this.themes = snapshot.resolvedThemes;
  }
}
