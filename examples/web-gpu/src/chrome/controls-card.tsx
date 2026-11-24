import type { BijouCanvasBackend } from '@flyingrobots/bijou-web';
import { Button } from '@/vendor/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/vendor/components/ui/card';
import { FieldDescription, FieldLegend, FieldSet } from '@/vendor/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/vendor/components/ui/toggle-group';
import { SHOWCASE_APPS } from '../apps.js';
import { BACKEND_LABELS, BACKENDS } from '../boot.js';
import { HOST_LABELS, HOSTS, isHost } from '../handoff.js';
import { hostNote } from '../hud.js';
import type { ShowcaseStore, ShowcaseView } from '../showcase-store.js';

const isBackend = (value: string): value is BijouCanvasBackend => BACKENDS.some((name) => name === value);

/** The app, host and backend choices and the hostile events, each a session operation. */
export function ControlsCard({ view, store }: { view: ShowcaseView; store: ShowcaseStore }) {
  const disabled = view.session === null;
  // The presenters belong to the canvas host; the DOM host is offered only to an app with a scene projection.
  const onDom = view.hud?.host === 'dom';
  const note = view.hud === null ? null : hostNote(view.hud);
  return (
    <Card data-region="controls" data-nav-region="controls" data-motion="">
      <CardHeader><CardTitle>Controls</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-6">
        <FieldSet>
          <FieldLegend>App</FieldLegend>
          <ToggleGroup type="single" variant="outline" size="lg" className="flex-wrap" value={view.hud?.app ?? ''} disabled={disabled}
            onValueChange={(id) => { if (id !== '') store.run((session) => session.mountApp(id)); }}>
            {SHOWCASE_APPS.map((app) => <ToggleGroupItem key={app.id} value={app.id} data-app={app.id} data-nav="">{app.title}</ToggleGroupItem>)}
          </ToggleGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>Host</FieldLegend>
          <ToggleGroup type="single" variant="outline" size="lg" className="flex-wrap" value={view.hud?.host ?? ''} disabled={disabled}
            onValueChange={(host) => { if (isHost(host)) store.run((session) => session.switchHost(host)); }}>
            {HOSTS.map((host) => (
              <ToggleGroupItem key={host} value={host} data-host={host} data-nav="" disabled={host === 'dom' && view.hud?.sceneApp !== true}>{HOST_LABELS[host]}</ToggleGroupItem>
            ))}
          </ToggleGroup>
          {note === null ? null : <FieldDescription data-host-note="">{note}</FieldDescription>}
        </FieldSet>
        <FieldSet>
          <FieldLegend>Backend</FieldLegend>
          <ToggleGroup type="single" variant="outline" size="lg" className="flex-wrap" value={view.hud?.backend ?? ''} disabled={disabled || onDom}
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
