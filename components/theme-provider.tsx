"use client"

import * as React from "react"

type Theme = "dark" | "light" | "system"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "dark" | "light"
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "theme",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setThemeState] = React.useState<Theme>("light")
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">("light")

  const applyTheme = React.useCallback(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement
      root.classList.remove("dark")
      root.classList.add("light")
      root.style.colorScheme = "light"
    }
    setResolvedTheme("light")
  }, [])

  const setTheme = React.useCallback(
    (t: Theme) => {
      setThemeState("light")
      applyTheme()
      try {
        localStorage.setItem(storageKey, "light")
      } catch {}
    },
    [applyTheme, storageKey]
  )

  React.useEffect(() => {
    setThemeState("light")
    applyTheme()
    try {
      localStorage.setItem(storageKey, "light")
    } catch {}
  }, [applyTheme, storageKey])

  return (
    <ThemeContext.Provider value={{ theme: "light", resolvedTheme: "light", setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    return { theme: "system" as Theme, resolvedTheme: "light" as const, setTheme: () => {} }
  }
  return ctx
}

export { ThemeProvider, useTheme }
