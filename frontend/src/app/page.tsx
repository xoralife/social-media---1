"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export default function Home() {
  const { token, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">SocialApp</h1>
          <nav className="flex items-center gap-4">
            {token ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
                <Link href="/create-post" className="text-sm font-medium hover:text-primary transition-colors">Create Post</Link>
                <button onClick={logout} className="text-sm text-red-500 hover:text-red-600">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
                <Link href="/register" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-xl">
          <h2 className="text-5xl font-bold tracking-tight text-gray-900">
            Share your <span className="text-primary">moments</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            A modern social platform to share posts, like, and comment with friends.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/register" className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors">
              Get Started
            </Link>
            <Link href="/login" className="border border-border px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              Sign In
            </Link>
          </div>
          {!token && (
            <Link href="/admin/login" className="mt-8 inline-block text-xs text-gray-400 hover:text-gray-600 underline">
              Admin Login
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
