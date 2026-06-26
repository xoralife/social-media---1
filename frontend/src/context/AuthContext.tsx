"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type AuthContextType = {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (t) setToken(t)
  }, [])

  const logout = () => {
    setToken(null)
    localStorage.removeItem("token")
  }

  return <AuthContext value={{ token, setToken, logout }}>{children}</AuthContext>
}

export const useAuth = () => useContext(AuthContext)
