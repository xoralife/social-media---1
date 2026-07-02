"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { getImageUrl } from "@/lib/api"
import ThemeToggle from "./ThemeToggle"

export default function Navbar({ children }: { children?: React.ReactNode }) {
  const { token, user, logout } = useAuth()
  const router = useRouter()

  if (!token) {
    return (
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <h1 className="text-lg font-bold">SocialApp</h1>
          <nav className="flex items-center gap-4 text-sm">
            <ThemeToggle />
            <Link href="/login">Log in</Link>
            <Link href="/register" className="bg-black text-white px-4 py-1.5 rounded-lg font-semibold">Sign up</Link>
          </nav>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">SocialApp</Link>
        <div className="flex items-center gap-3 text-sm">
          {children}
          <ThemeToggle />
          {user && (
            <Link href="/profile" className="flex items-center gap-1.5">
              {user.profile_pic ? (
                <img src={getImageUrl(user.profile_pic)} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          )}
          <button onClick={() => { logout(); router.push("/") }} className="text-red-500">Logout</button>
        </div>
      </div>
    </header>
  )
}
