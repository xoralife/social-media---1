"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { getImageUrl, api } from "@/lib/api"
import ThemeToggle from "./ThemeToggle"

export default function Navbar({ children }: { children?: React.ReactNode }) {
  const { token, user, logout } = useAuth()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [showNav, setShowNav] = useState(true)
  const lastScrollY = useRef(0)

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!token) {
      setUnreadCount(0)
      return
    }
    let active = true
    const fetchUnread = () => {
      api.getUnreadCount(token).then(res => {
        if (active) setUnreadCount(res.unread_count ?? 0)
      }).catch(() => {})
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 5000)
    return () => { active = false; clearInterval(interval) }
  }, [token])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY > lastScrollY.current && currentY > 50) {
        setShowNav(false)
      } else {
        setShowNav(true)
      }
      lastScrollY.current = currentY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleDeleteAccount = async () => {
    if (!token) return
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return
    try {
      await api.deleteAccount(token)
      logout()
      router.push("/")
    } catch {}
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!token) {
    return (
      <header className="border-b border-border sticky top-0 z-40 bg-white">
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
    <header className={`bg-white border-b border-border sticky top-0 z-40 transition-transform duration-300 ${showNav ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold">SocialApp</Link>
        <div className="flex items-center gap-3 text-sm">
          {children}
          <ThemeToggle />
          {unreadCount > 0 && (
            <Link href="/chat" className="relative inline-flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            </Link>
          )}
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
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-border py-1 z-50">
                <button onClick={() => { handleLogout(); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 font-semibold">
                  Logout
                </button>
                <button onClick={() => { handleDeleteAccount(); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 font-semibold">
                  Delete Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
