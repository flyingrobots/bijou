import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/vendor/components/ui/card';
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from '@/vendor/components/ui/item';
import { KeyHint } from './key-hint.js';

export interface KeyHintRow {
  readonly label: string;
  readonly keys: readonly (readonly string[])[];
}

/** The page's keys, and the rule that hands every key to a focused Bijou mount. */
export function KeysCard({ rows }: { rows: readonly KeyHintRow[] }) {
  return (
    <Card data-region="keys" data-motion="">
      <CardHeader>
        <CardTitle>Keys</CardTitle>
        <CardDescription>While a Bijou mount has focus, every key goes to the app; these keys work everywhere else.</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {rows.map((row) => (
            <Item key={row.label} size="xs">
              <ItemContent><ItemTitle>{row.label}</ItemTitle></ItemContent>
              <ItemActions>{row.keys.map((keys) => <KeyHint key={keys.join(' ')} keys={keys} />)}</ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}

/** The keys both pages share. */
export const SHARED_KEYS: readonly KeyHintRow[] = [
  { label: 'Command palette', keys: [['Esc'], ['Space', 'Space']] },
  { label: 'Move through the controls', keys: [['j', 'k'], ['↓', '↑']] },
  { label: 'Previous or next region', keys: [['h', 'l'], ['←', '→']] },
  { label: 'GPU showcase', keys: [['Space', 'g']] },
  { label: 'DOM check', keys: [['Space', 'd']] },
  { label: 'Theme', keys: [['Space', 't']] },
];
