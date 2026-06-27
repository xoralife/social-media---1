"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeContextType = {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored) {
      setTheme(stored)
      document.documentElement.classList.toggle("dark", stored === "dark")
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.classList.toggle("dark", next === "dark")
    localStorage.setItem("theme", next)
  }

  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
}

export const useTheme = () => useContext(ThemeContext)
