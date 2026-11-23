import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/vendor/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/vendor/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@/vendor/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/vendor/components/ui/tooltip"

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const

type Theme = (typeof themes)[number]["value"]

// Like mode-toggle, but it shows which theme is chosen, can be opened from a key, and names that key.
export function ThemeSwitch({
  open,
  onOpenChange,
  keys,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "children"> & {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  keys?: readonly string[]
}) {
  const { theme, setTheme } = useTheme()
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-lg" aria-label="Theme" {...props}>
              <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          Theme
          {keys && (
            <KbdGroup>
              {keys.map((k, i) => (
                <Kbd key={i}>{k}</Kbd>
              ))}
            </KbdGroup>
          )}
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
          {themes.map((t) => (
            <DropdownMenuRadioItem key={t.value} value={t.value}>
              {t.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
