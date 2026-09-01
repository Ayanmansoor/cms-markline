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
  defaultTheme = "system",
  storageKey = "theme",
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">("light")

  const resolve = React.useCallback((t: Theme): "dark" | "light" => {
    if (t === "dark" || t === "light") return t
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }
    return "light"
  }, [])

  const applyTheme = React.useCallback(
    (t: Theme) => {
      const resolved = resolve(t)
      const root = document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(resolved)
      root.style.colorScheme = resolved
      setResolvedTheme(resolved)
    },
    [resolve]
  )

  const setTheme = React.useCallback(
    (t: Theme) => {
      setThemeState(t)
      applyTheme(t)
      try {
        localStorage.setItem(storageKey, t)
      } catch {}
    },
    [applyTheme, storageKey]
  )

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme | null
      const initial = stored || defaultTheme
      setThemeState(initial)
      applyTheme(initial)
    } catch {
      applyTheme(defaultTheme)
    }
  }, [defaultTheme, storageKey, applyTheme])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") {
        applyTheme("system")
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme, applyTheme])

  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        const t = e.newValue as Theme
        setThemeState(t)
        applyTheme(t)
      }
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [storageKey, applyTheme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
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
