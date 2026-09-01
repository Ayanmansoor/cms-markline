"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 relative transition-colors"
    >
      <Sun className="h-[22px] w-[22px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[22px] w-[22px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
