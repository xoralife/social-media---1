"use client"

import { useTheme } from "@/context/ThemeContext"

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-5 rounded-full transition-colors duration-200 border border-border"
      style={{ backgroundColor: theme === "dark" ? "#525252" : "#e5e5e5" }}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <span
        className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: theme === "dark" ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  )
}
