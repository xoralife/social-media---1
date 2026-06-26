"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

type Profile = {
  id: number
  username: string
  email: string
  posts_count: number
}

export default function UserProfile() {
  const { token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return router.push("/login")
    const userId = Number(params.id)
    if (!userId) { setError("Invalid user"); return }
    api.getUserProfile(userId, token)
      .then(setProfile)
      .catch(() => setError("User not found"))
  }, [token, router, params.id])

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <p className="text-gray-500">{error}</p>
        <Link href="/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">Back to Dashboard</Link>
      </div>
    </div>
  )

  if (!profile) return null

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">SocialApp</Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mx-auto">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold mt-4">{profile.username}</h2>
          <p className="text-sm text-gray-500 mt-4">
            <span className="font-semibold text-gray-900">{profile.posts_count}</span> posts
          </p>
        </div>
      </main>
    </div>
  )
}
