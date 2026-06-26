"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export default function Home() {
  const { token, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <h1 className="text-lg font-bold">SocialApp</h1>
          <nav className="flex items-center gap-4 text-sm">
            {token ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/create-post">Create</Link>
                <Link href="/profile">Profile</Link>
                <button onClick={() => { logout(); }} className="text-red-500">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login">Log in</Link>
                <Link href="/register" className="bg-black text-white px-4 py-1.5 rounded-lg font-semibold">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <h2 className="text-4xl font-bold tracking-tight">
            Share your <span className="italic">moments</span>
          </h2>
          <p className="mt-4 text-sm text-gray-500">
            A modern social platform to share posts, like, and comment with friends.
          </p>
          {!token && (
            <div className="mt-6 flex gap-3 justify-center">
              <Link href="/register" className="bg-black text-white px-6 py-2 rounded-lg text-sm font-semibold">
                Get Started
              </Link>
              <Link href="/login" className="border border-border px-6 py-2 rounded-lg text-sm font-semibold">
                Sign In
              </Link>
            </div>
          )}
          {!token && (
            <Link href="/admin/login" className="mt-6 inline-block text-xs text-gray-400 hover:text-gray-600">
              Admin Login
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
