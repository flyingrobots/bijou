import { Kbd, KbdGroup } from '@/vendor/components/ui/kbd';

/** One key, or a sequence such as `Space` then `t`, in shadcn's Kbd. */
export function KeyHint({ keys }: { keys: readonly string[] }) {
  if (keys.length === 1) return <Kbd>{keys[0]}</Kbd>;
  return (
    <KbdGroup>
      {keys.map((key, index) => <Kbd key={`${String(index)}:${key}`}>{key}</Kbd>)}
    </KbdGroup>
  );
}
