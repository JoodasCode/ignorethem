"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { useAuth } from "@/hooks/use-auth"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { isAuthenticated } = useAuth()
  const { updateTheme } = useUserPreferences()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = async () => {
    const newTheme = theme === "light" ? "dark" : "light"
    
    // Update theme immediately for responsive UI
    setTheme(newTheme)
    
    // Save to user preferences if authenticated
    if (isAuthenticated) {
      try {
        await updateTheme(newTheme)
      } catch (error) {
        console.error('Failed to save theme preference:', error)
        // Theme is already updated locally, so we don't revert
      }
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm">
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleThemeToggle}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
