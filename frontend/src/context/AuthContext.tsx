"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, type SetStateAction, type Dispatch } from "react"
import { api } from "@/lib/api"

export type UserData = {
  id: number
  username: string
  profile_pic: string | null
}

type AuthContextType = {
  token: string | null
  setToken: (t: string | null) => void
  logout: () => void
  user: UserData | null
  setUser: Dispatch<SetStateAction<UserData | null>>
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
  logout: () => {},
  user: null,
  setUser: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (t) setToken(t)
  }, [])

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }
    api.getProfile(token).then(setUser).catch(() => setUser(null))
  }, [token])

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
  }

  return <AuthContext value={{ token, setToken, logout, user, setUser }}>{children}</AuthContext>
}

export const useAuth = () => useContext(AuthContext)
