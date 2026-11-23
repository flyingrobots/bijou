import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/vendor/components/ui/command';
import type { ChromeCommand } from './commands.js';
import { KeyHint } from './key-hint.js';

/** The command palette: every control of the page, searchable. `Esc` opens it from the chrome. */
export function Palette({ open, onOpenChange, commands }: { open: boolean; onOpenChange: (open: boolean) => void; commands: readonly ChromeCommand[] }) {
  const groups = [...new Set(commands.map((command) => command.group))];
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Commands" description="Search for a control, a page or a theme.">
      <Command>
        <CommandInput placeholder="Type a command…" />
        <CommandList className="max-h-[min(18rem,calc(66dvh-6rem))]">
          <CommandEmpty>No matching command.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {commands.filter((command) => command.group === group).map((command) => (
                <CommandItem key={command.id} value={`${group} ${command.label}`} onSelect={() => { onOpenChange(false); command.run(); }}>
                  {command.label}
                  {command.keys !== undefined && <CommandShortcut><KeyHint keys={command.keys} /></CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
