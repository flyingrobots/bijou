import {
  afterEach,
  BIJOU_VERSION,
  cellsWithoutBackground,
  colorHex,
  createDocsApp,
  createNodeDocsApp,
  createTestContext,
  describe,
  DOGFOOD_I18N_CATALOG,
  DOGFOOD_NON_INTERACTIVE_MESSAGE,
  DOGFOOD_TERMINAL_NOTICE,
  dogfoodTerminalReadiness,
  execFileSync,
  expectedLandingWakeColorAt,
  expect,
  FLYING_ROBOTS_LOGO_TEXT,
  FLYING_ROBOTS_TRANSPARENT_CELL,
  FRAME_I18N_CATALOG,
  frameText,
  it,
  KEY_ENTER,
  KEY_ESCAPE,
  KEY_F2,
  oppositeHexColor,
  pseudoLocalize,
  readFileSync,
  resolve,
  runScript,
  stripMarkdownFrontmatter,
  V7_DEFAULT_BACKGROUND,
  withLocaleValues,
  wrapPageMsg,
  _resetDefaultContextForTesting,
} from './docs-preview.test-support.js';

describe('docs preview app', () => {
  afterEach(() => _resetDefaultContextForTesting());

  it('uses the live local runtime entrypoint instead of the packaged build', () => {
    const source = readFileSync(new URL('../examples/docs/main.ts', import.meta.url), 'utf8');
    const nodeSource = readFileSync(new URL('../examples/docs/node-app.ts', import.meta.url), 'utf8');

    expect(source).toContain("../../packages/bijou-node/src/index.js");
    expect(nodeSource).toContain("../../packages/bijou-tui/src/index.js");
    expect(source).toContain("import { runNodeDocsApp } from './node-app.js';");
    expect(source).toContain('runNodeDocsApp(ctx');
    expect(source).toContain('dogfoodTerminalReadiness(ctx)');
    expect(source).toContain('DOGFOOD_TERMINAL_NOTICE');
  });

  it('explains DOGFOOD terminal takeover and non-TTY failure modes', () => {
    const ready = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: true, stdoutIsTTY: true },
    }));
    const pipedStdout = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: true, stdoutIsTTY: false },
    }));
    const pipedStdin = dogfoodTerminalReadiness(createTestContext({
      runtime: { stdinIsTTY: false, stdoutIsTTY: true },
    }));

    expect(ready).toEqual({ ok: true });
    expect(pipedStdout).toEqual({ ok: false, message: DOGFOOD_NON_INTERACTIVE_MESSAGE });
    expect(pipedStdin).toEqual({ ok: false, message: DOGFOOD_NON_INTERACTIVE_MESSAGE });
    expect(DOGFOOD_NON_INTERACTIVE_MESSAGE).toContain('stdin and stdout');
    expect(DOGFOOD_NON_INTERACTIVE_MESSAGE).toContain('npm run smoke:dogfood');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('full-screen interactive TUI');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('press q');
    expect(DOGFOOD_TERMINAL_NOTICE).toContain('Ctrl-C');
  });

  it('builds the Node DOGFOOD app through the locale adapter instead of process reads in view code', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createNodeDocsApp(ctx, { LC_ALL: 'fr_FR.UTF-8' });

    const result = await runScript(app, [{ key: KEY_ENTER }, { key: KEY_F2 }], { ctx });

    expect(frameText(result.frames.at(-1)!)).toContain('Langue préférée');
  });

  it('imports the DOGFOOD app through the same tsx path used by npm run dogfood', () => {
    execFileSync(
      process.execPath,
      ['--import', 'tsx', '--input-type=module', '-e', "await import('./examples/docs/app.ts')"],
      {
        cwd: resolve(import.meta.dirname, '..'),
        stdio: 'pipe',
      },
    );
  });

  it('strips Markdown frontmatter before DOGFOOD renders prose content', () => {
    expect(stripMarkdownFrontmatter([
      '---',
      'dogfood:',
      '  localization:',
      '    sourceLocale: en',
      '---',
      '# Start Here',
      '',
      'Visible guide body.',
    ].join('\n'))).toBe([
      '# Start Here',
      '',
      'Visible guide body.',
    ].join('\n'));
    expect(stripMarkdownFrontmatter('# Plain guide')).toBe('# Plain guide');
  });

  it('builds the framed explorer shell from the provided ctx without relying on a default singleton', async () => {
    _resetDefaultContextForTesting();
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx, { initialRoute: 'docs' });

    const result = await runScript(app, [], { ctx });
    expect((result.model).route).toBe('docs');
  });

  it('lands on the hero page first and enters the docs on Enter', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 120, rows: 40 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    expect((initial.model).route).toBe('landing');

    const ignored = await runScript(app, [{ key: 'a' }], { ctx });
    expect((ignored.model).route).toBe('landing');
    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    expect((entered.model).route).toBe('docs');
    const enteredFrame = entered.frames.at(-1)!;
    const enteredText = frameText(enteredFrame);
    expect(enteredText).toContain('Bijou Docs');
    expect(enteredText).toContain('Start Here');
    expect(enteredText).not.toContain('Press [Enter]');
    expect(enteredText).not.toContain('V7 Launch Wake');
  });

  it('renders the landing page with the animated title treatment and minimal entry copy', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200, rows: 60, refreshRate: 73 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = initial.frames[0]!;

    let text = '';
    for (let y = 0; y < frame.height; y++) {
      for (let x = 0; x < frame.width; x++) {
        text += frame.get(x, y).char || ' ';
      }
      text += '\n';
    }

    const lines = text.split('\n');
    const footer = lines[frame.height - 1] ?? '';

    expect(text).toContain('Press [Enter]');
    expect(footer).toContain('Esc/q quit');
    expect(footer).toContain('↑/↓ quality');
    expect(footer).toContain('←/→ theme');
    expect(footer).toContain('Enter continue');
    expect(footer).toContain(`v${BIJOU_VERSION}`);
    expect(footer).toMatch(/\d+ fps • auto\/full/);
    expect(lines[0]).not.toMatch(/\d+ fps/);
    expect(text).not.toContain('Documentation coverage');
    expect(text).toContain('DOGFOOD');
    expect(text).toContain('Documentation Of Good');
    expect(text).toContain('V7 Launch Wake');
    expect(text).not.toContain('What is Bijou?');
    expect(text).not.toContain('How to use these docs');
    // Gradient background chars (█▓▒░·) require pulse-driven animation;
    // the initial frame without pulses may not contain them. The pulse
    // test below ('animates the landing title screen on pulse') covers this.
  });

  it('uses the checked-in FlyingRobots logo asset on roomy landing screens', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 320, rows: 80, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = initial.frames[0]!;
    const text = frameText(frame);
    const lines = text.split('\n');
    const logoLines = FLYING_ROBOTS_LOGO_TEXT.split(/\r?\n/);
    const [firstLogoLine = ''] = logoLines;
    const transparentOffset = firstLogoLine.indexOf(FLYING_ROBOTS_TRANSPARENT_CELL);
    const visiblePrefix = firstLogoLine.slice(0, transparentOffset);
    const logoY = lines.findIndex((line) => line.includes(visiblePrefix));
    const logoX = logoY >= 0 ? lines[logoY]!.indexOf(visiblePrefix) : -1;
    let wakeBackedLogoCell: { readonly x: number; readonly y: number } | undefined;
    let backgroundBackedLogoCell: { readonly x: number; readonly y: number } | undefined;

    expect(transparentOffset).toBeGreaterThan(0);
    expect(visiblePrefix.length).toBeGreaterThan(8);
    expect(logoY).toBeGreaterThanOrEqual(0);
    expect(logoX).toBeGreaterThanOrEqual(0);
    for (let y = 0; y < logoLines.length; y++) {
      const logoLine = Array.from(logoLines[y] ?? '');
      for (let x = 0; x < logoLine.length; x++) {
        const char = logoLine[x];
        if (char === ' ' || char === FLYING_ROBOTS_TRANSPARENT_CELL) continue;
        const targetX = logoX + x;
        const targetY = logoY + y;
        const bg = expectedLandingWakeColorAt(targetX, targetY, frame.width, frame.height);
        if (bg !== V7_DEFAULT_BACKGROUND) {
          wakeBackedLogoCell = { x: targetX, y: targetY };
        } else {
          backgroundBackedLogoCell = { x: targetX, y: targetY };
        }
        if (wakeBackedLogoCell != null && backgroundBackedLogoCell != null) {
          break;
        }
      }
      if (wakeBackedLogoCell != null && backgroundBackedLogoCell != null) break;
    }
    expect(wakeBackedLogoCell).toBeDefined();
    const wakeBackedBg = expectedLandingWakeColorAt(
      wakeBackedLogoCell!.x,
      wakeBackedLogoCell!.y,
      frame.width,
      frame.height,
    );
    expect(colorHex(frame.get(wakeBackedLogoCell!.x, wakeBackedLogoCell!.y).bg)).toBe(wakeBackedBg);
    expect(colorHex(frame.get(wakeBackedLogoCell!.x, wakeBackedLogoCell!.y).fg)).toBe(
      oppositeHexColor(wakeBackedBg),
    );
    expect(backgroundBackedLogoCell).toBeDefined();
    expect(colorHex(frame.get(backgroundBackedLogoCell!.x, backgroundBackedLogoCell!.y).bg)).toBe(V7_DEFAULT_BACKGROUND);
    expect(colorHex(frame.get(backgroundBackedLogoCell!.x, backgroundBackedLogoCell!.y).fg)).toBe(
      oppositeHexColor(V7_DEFAULT_BACKGROUND),
    );
    expect(frame.get(logoX + transparentOffset, logoY).char).not.toBe(FLYING_ROBOTS_TRANSPARENT_CELL);
    expect(frame.get(logoX + transparentOffset, logoY).modifiers ?? []).not.toContain('bold');
    expect(text).not.toContain('8""""');
  });

  it('fades the FlyingRobots logo after the first three seconds', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 320, rows: 80, refreshRate: 60 } });
    const app = createDocsApp(ctx);
    const logoLines = FLYING_ROBOTS_LOGO_TEXT.split(/\r?\n/);
    const [firstLogoLine = ''] = logoLines;
    const visiblePrefix = firstLogoLine.slice(0, firstLogoLine.indexOf(FLYING_ROBOTS_TRANSPARENT_CELL));

    const initial = await runScript(app, [], { ctx });
    const faded = await runScript(app, [{ pulse: { dt: 4.2 } }], { ctx });

    expect(visiblePrefix.length).toBeGreaterThan(8);
    expect(frameText(initial.frames[0]!)).toContain(visiblePrefix);
    expect(frameText(faded.frames.at(-1)!)).not.toContain(visiblePrefix);
  });

  it('uses a foreground gradient across the Enter prompt letters', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 160, rows: 48, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = initial.frames[0]!;
    const lines = frameText(frame).split('\n');
    const promptY = lines.findIndex((line) => line.includes('Press [Enter]'));
    const promptX = promptY >= 0 ? lines[promptY]!.indexOf('Press [Enter]') : -1;
    const prompt = 'Press [Enter]';
    const enterStart = prompt.indexOf('Enter');

    expect(promptY).toBeGreaterThanOrEqual(0);
    expect(promptX).toBeGreaterThanOrEqual(0);

    const enterColors = Array.from('Enter').map((_char, offset) => (
      colorHex(frame.get(promptX + enterStart + offset, promptY).fg)
    ));
    const bodyColor = colorHex(frame.get(promptX, promptY).fg);

    expect(new Set(enterColors).size).toBeGreaterThan(1);
    expect(enterColors).not.toContain(bodyColor);
  });

  it('keeps FlyingRobots logo backgrounds transparent when the landing quit modal dims the title', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 320, rows: 80, refreshRate: 60 } });
    const app = createDocsApp(ctx);

    const opened = await runScript(app, [{ key: KEY_ESCAPE }], { ctx });
    const frame = opened.frames.at(-1)!;
    const text = frameText(frame);
    const lines = text.split('\n');
    const logoLines = FLYING_ROBOTS_LOGO_TEXT.split(/\r?\n/);
    const [firstLogoLine = ''] = logoLines;
    const transparentOffset = firstLogoLine.indexOf(FLYING_ROBOTS_TRANSPARENT_CELL);
    const visiblePrefix = firstLogoLine.slice(0, transparentOffset);
    const logoY = lines.findIndex((line) => line.includes(visiblePrefix));
    const logoX = logoY >= 0 ? lines[logoY]!.indexOf(visiblePrefix) : -1;
    let wakeBackedLogoCell: { readonly x: number; readonly y: number } | undefined;

    expect(text).toContain('Quit?');
    expect(logoY).toBeGreaterThanOrEqual(0);
    expect(logoX).toBeGreaterThanOrEqual(0);
    for (let y = 0; y < logoLines.length; y++) {
      const logoLine = Array.from(logoLines[y] ?? '');
      for (let x = 0; x < logoLine.length; x++) {
        const char = logoLine[x];
        if (char === ' ' || char === FLYING_ROBOTS_TRANSPARENT_CELL) continue;
        const targetX = logoX + x;
        const targetY = logoY + y;
        if (expectedLandingWakeColorAt(targetX, targetY, frame.width, frame.height) !== V7_DEFAULT_BACKGROUND) {
          wakeBackedLogoCell = { x: targetX, y: targetY };
          break;
        }
      }
      if (wakeBackedLogoCell != null) break;
    }

    expect(wakeBackedLogoCell).toBeDefined();
    const cell = frame.get(wakeBackedLogoCell!.x, wakeBackedLogoCell!.y);
    const wakeBackedBg = expectedLandingWakeColorAt(
      wakeBackedLogoCell!.x,
      wakeBackedLogoCell!.y,
      frame.width,
      frame.height,
    );
    expect(colorHex(cell.bg)).toBe(wakeBackedBg);
    expect(colorHex(cell.fg)).toBe(oppositeHexColor(wakeBackedBg));
    expect(cell.modifiers ?? []).toContain('dim');
  });

  it('keeps every landing title cell on a Bijou-owned background', async () => {
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 200, rows: 60, refreshRate: 73 } });
    const app = createDocsApp(ctx);

    const initial = await runScript(app, [], { ctx });
    const frame = initial.frames[0]!;

    expect(cellsWithoutBackground(frame)).toEqual([]);
  });

  it('accepts localized shell and DOGFOOD catalogs for landing and onboarding copy', async () => {
    const locale = 'qps-ploc';
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 140, rows: 40, refreshRate: 60 } });
    const app = createDocsApp(ctx, {
      locale,
      direction: 'ltr',
      extraI18nCatalogs: [
        withLocaleValues(DOGFOOD_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
        withLocaleValues(FRAME_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
      ],
    });

    const landing = await runScript(app, [], { ctx });
    expect(frameText(landing.frames.at(-1)!)).toContain(pseudoLocalize('Press [Enter]'));

    const entered = await runScript(app, [{ key: KEY_ENTER }], { ctx });
    const text = frameText(entered.frames.at(-1)!);
    expect(text).toContain(pseudoLocalize('Guides'));
    expect(text).toMatch(/Šëàřçħ/);
  });

  it('localizes the DOGFOOD surface block inventory page from the catalog', async () => {
    const locale = 'qps-ploc';
    const ctx = createTestContext({ mode: 'interactive', runtime: { columns: 150, rows: 48, refreshRate: 60 } });
    const app = createDocsApp(ctx, {
      initialRoute: 'docs',
      initialPageId: 'blocks',
      locale,
      direction: 'ltr',
      extraI18nCatalogs: [
        withLocaleValues(DOGFOOD_I18N_CATALOG, locale, (value) => pseudoLocalize(value)),
      ],
    });

    const selected = await runScript(app, [{
      msg: {
        type: 'docs',
        msg: wrapPageMsg('blocks', { type: 'select-guide', guideId: 'blocks-dogfood-surfaces' }),
      },
    }], { ctx });
    const text = frameText(selected.frames.at(-1)!);

    expect(text).toContain(pseudoLocalize('DOGFOOD Surface Blocks'));
    expect(text).toContain(pseudoLocalize('Surface index'));
    expect(text).toContain(pseudoLocalize('DOGFOOD title and entry action surface.'));
    expect(text).not.toContain('DOGFOOD currently registers');
    expect(text).not.toContain('DOGFOOD title and entry action surface.');
  });
});
