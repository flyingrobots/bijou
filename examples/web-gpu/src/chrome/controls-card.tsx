import type { BijouCanvasBackend } from '@flyingrobots/bijou-web';
import { Button } from '@/vendor/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/vendor/components/ui/card';
import { FieldLegend, FieldSet } from '@/vendor/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/vendor/components/ui/toggle-group';
import { SHOWCASE_APPS } from '../apps.js';
import { BACKEND_LABELS, BACKENDS } from '../boot.js';
import type { ShowcaseStore, ShowcaseView } from '../showcase-store.js';

const isBackend = (value: string): value is BijouCanvasBackend => BACKENDS.some((name) => name === value);

/** The app and backend choices and the hostile events, each a session operation. */
export function ControlsCard({ view, store }: { view: ShowcaseView; store: ShowcaseStore }) {
  const disabled = view.session === null;
  return (
    <Card data-region="controls" data-nav-region="controls" data-motion="">
      <CardHeader><CardTitle>Controls</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-6">
        <FieldSet>
          <FieldLegend>App</FieldLegend>
          <ToggleGroup type="single" variant="outline" size="lg" value={view.hud?.app ?? ''} disabled={disabled}
            onValueChange={(id) => { if (id !== '') store.run((session) => session.mountApp(id)); }}>
            {SHOWCASE_APPS.map((app) => <ToggleGroupItem key={app.id} value={app.id} data-app={app.id} data-nav="">{app.title}</ToggleGroupItem>)}
          </ToggleGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>Backend</FieldLegend>
          <ToggleGroup type="single" variant="outline" size="lg" value={view.hud?.backend ?? ''} disabled={disabled}
            onValueChange={(name) => { if (isBackend(name)) store.run((session) => session.switchBackend(name)); }}>
            {BACKENDS.map((name) => <ToggleGroupItem key={name} value={name} data-backend={name} data-nav="">{BACKEND_LABELS[name]}</ToggleGroupItem>)}
          </ToggleGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>Hostile events</FieldLegend>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="lg" data-action="lose-context" data-nav="" disabled={disabled}
              onClick={() => { store.run((session) => session.loseContext()); }}>Lose the WebGL2 context</Button>
            <Button variant="outline" size="lg" data-action="reset-atlas" data-nav="" disabled={disabled}
              onClick={() => { store.run((session) => session.resetAtlas()); }}>Reset the glyph atlas</Button>
          </div>
        </FieldSet>
      </CardContent>
    </Card>
  );
}
