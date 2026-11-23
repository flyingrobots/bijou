import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Browser storage can be missing or throw (private windows, blocked site data); the theme then
// lasts for the visit only.
function readTheme(key: string): Theme | null {
  try {
    const stored = localStorage.getItem(key)
    return stored === "dark" || stored === "light" || stored === "system" ? stored : null
  } catch {
    return null
  }
}

function writeTheme(key: string, theme: Theme) {
  try {
    localStorage.setItem(key, theme)
  } catch {
    // the choice still applies until the page closes
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => readTheme(storageKey) ?? defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      // follow the device, including when it changes while the page is open
      const query = window.matchMedia("(prefers-color-scheme: dark)")
      const apply = () => {
        root.classList.remove("light", "dark")
        root.classList.add(query.matches ? "dark" : "light")
      }
      apply()
      query.addEventListener("change", apply)
      return () => query.removeEventListener("change", apply)
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      writeTheme(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
