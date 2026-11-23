import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/vendor/components/ui/card';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/vendor/components/ui/item';
import { REFUSED_APPS } from '../apps.js';

/** The example apps the page cannot mount unmodified, each with its typed refusal. */
export function RefusedCard() {
  if (REFUSED_APPS.length === 0) return null;
  return (
    <Card data-region="refused" data-motion="">
      <CardHeader>
        <CardTitle>Not mounted</CardTitle>
        <CardDescription>These examples cannot be bundled for a browser unmodified.</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {REFUSED_APPS.map((app) => (
            <Item key={app.id} variant="muted" size="sm" data-refused={app.id}>
              <ItemContent>
                <ItemTitle>{app.title}:</ItemTitle>{' '}
                <ItemDescription>{app.code}: {app.reason}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
