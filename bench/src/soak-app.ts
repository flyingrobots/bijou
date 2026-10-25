import { createSurface, perfOverlaySurface, type BijouContext } from '@flyingrobots/bijou';
import { createFramedApp, createKeyMap, type Cmd } from '@flyingrobots/bijou-tui';
import { displayScenarios } from './soak-config.js';
import { latestPaneSize, type SoakModel, type SoakMsg } from './soak-model.js';
import { initScenario, renderScenarioSurface, scenarioShortLabel } from './soak-scenarios.js';
import { formatNs } from './stats.js';
import { updateSoak } from './soak-update.js';

export function createSoakApp(appCtx: BijouContext) {
  return createFramedApp<SoakModel, SoakMsg>({
    title: 'Soak Runner',
    pages: [{
      id: 'soak',
      title: 'Soak',
      init(): [SoakModel, Cmd<SoakMsg>[]] {
        // Use the latest known pane dimensions, or a reasonable default
        // until the first render tells us the real size.
        const w = latestPaneSize.width || 80;
        const h = latestPaneSize.height || 24;
        return [initScenario(0, 0, w, h), []];
      },
      keyMap: createKeyMap<SoakMsg>().bind('`', 'Toggle perf overlay', { type: 'toggle-perf' }),
      update: updateSoak,
      layout(model: SoakModel) {
        return {
          kind: 'pane' as const,
          paneId: 'soak',
          render: (width: number, height: number) => {
            // Capture actual pane dimensions for the update loop.
            latestPaneSize.width = width;
            latestPaneSize.height = height;
            const scene = renderScenarioSurface(model, width, height);

            if (!model.showPerf) return scene;

            // Composite the perf overlay into the top-right corner.
            const recent = model.frameTimes;
            const windowSize = Math.min(20, recent.length);
            let avgNs = 0;
            if (windowSize > 0) {
              let sum = 0;
              for (const ns of recent.slice(recent.length - windowSize)) sum += ns;
              avgNs = sum / windowSize;
            }
            const mem = process.memoryUsage();
            const historyMs = recent.length > 1 ? recent.map((ns) => ns / 1_000_000) : [];
            const measuredFps = avgNs > 0 ? 1_000_000_000 / avgNs : 0;
            const perfPanel = perfOverlaySurface({
              fps: measuredFps,
              frameTimeMs: avgNs / 1_000_000,
              frameTimeHistory: historyMs,
              width,
              height,
              heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024 * 10) / 10,
              rssMB: Math.round(mem.rss / 1024 / 1024 * 10) / 10,
              extras: [
                { label: 'scenario', value: scenarioShortLabel(model) },
                { label: 'frame', value: String(model.frameIndex) },
                {
                  label: 'cycle',
                  value: `${String(model.cycle)} [${String(model.scenarioIndex + 1)}/${String(displayScenarios.length)}]`,
                },
              ],
            }, {
              title: 'Perf',
              width: Math.min(36, Math.floor(width * 0.4)),
              chartHeight: 5,
              ctx: appCtx,
            });
            // Composite onto a fresh surface to avoid mutating the
            // scenario-owned buffer (which would leave stale overlay
            // pixels after toggling perf off).
            const composite = createSurface(width, height);
            composite.blit(scene, 0, 0);
            composite.blit(perfPanel, width - perfPanel.width - 1, 1);
            return composite;
          },
        };
      },
    }],
    helpLineSource({ model: frameModel }) {
      const pageModel = frameModel.pageModels[frameModel.activePageId];
      if (!pageModel) return '';
      // Show rolling average over recent frames for a stable reading.
      const recent = pageModel.frameTimes;
      const windowSize = Math.min(20, recent.length);
      let avg = 0;
      if (windowSize > 0) {
        let sum = 0;
        for (let i = recent.length - windowSize; i < recent.length; i++) {
          sum += recent[i] ?? 0;
        }
        avg = sum / windowSize;
      }
      const ft = formatNs(avg);
      const dims = `${String(pageModel.paneWidth)}×${String(pageModel.paneHeight)}`;
      const left = `${scenarioShortLabel(pageModel)}  ${dims}  frame ${String(pageModel.frameIndex)}  ${ft}/frame`;
      const right = `cycle ${String(pageModel.cycle)}  [${String(pageModel.scenarioIndex + 1)}/${String(displayScenarios.length)}]`;
      return `${left}  |  ${right}  |  \` perf`;
    },
  });
}
