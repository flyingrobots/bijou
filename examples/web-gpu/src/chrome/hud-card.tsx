import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/vendor/components/ui/card';
import { Skeleton } from '@/vendor/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/vendor/components/ui/table';
import { hudRows } from '../hud.js';
import type { ShowcaseView } from '../showcase-store.js';

// The rows the HUD shows; while the first state is read, each value is a Skeleton.
const LABELS = ['App', 'Backend', 'Fallback reasons', 'Grid', 'Cell', 'Device pixel ratio', 'Frame time', 'Evidence', 'Adapter', 'Atlas generation', 'Shader', 'Frame', 'WebGL2 context', 'Refusal or fault'];

/** What the mount and each presenter's receipt report, refreshed five times a second. */
export function HudCard({ view }: { view: ShowcaseView }) {
  const rows = view.hud === null ? null : hudRows(view.hud);
  return (
    <Card data-region="hud" data-motion="">
      <CardHeader>
        <CardTitle>HUD</CardTitle>
        <CardDescription>The mount handle and the newest receipt.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {rows === null
              ? LABELS.map((label) => (
                <TableRow key={label}><TableHead>{label}</TableHead><TableCell><Skeleton className="h-4 w-24" /></TableCell></TableRow>
              ))
              : rows.map(([key, label, text]) => (
                <TableRow key={key}>
                  <TableHead>{label}</TableHead>
                  <TableCell data-hud={key} className="font-mono">{text}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
