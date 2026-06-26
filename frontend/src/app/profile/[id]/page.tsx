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

type Post = {
  id: number
  user_id: number
  image_url: string
  title: string
}

export default function UserProfile() {
  const { token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return router.push("/login")
    const userId = Number(params.id)
    if (!userId) { setError("Invalid user"); return }
    api.getUserProfile(userId, token)
      .then(setProfile)
      .catch(() => setError("User not found"))
  }, [token, router, params.id])

  useEffect(() => {
    if (!token || !profile) return
    api.getPosts(token).then(all => {
      setUserPosts(all.filter((p: Post) => p.user_id === profile.id))
    }).catch(() => {})
  }, [token, profile])

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <p className="text-gray-500">{error}</p>
        <Link href="/dashboard" className="text-accent text-sm mt-4 inline-block">Back to Dashboard</Link>
      </div>
    </div>
  )

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-light">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile.username}</h2>
            <div className="flex gap-6 mt-3 text-sm">
              <span><strong>{profile.posts_count}</strong> posts</span>
              <span><strong>0</strong> followers</span>
              <span><strong>0</strong> following</span>
            </div>
          </div>
        </div>

        <p className="text-sm mb-4">I am A penter</p>

        <div className="flex gap-2 mb-6">
          <button className="flex-1 py-1.5 text-sm font-semibold bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            follow
          </button>
          <button className="flex-1 py-1.5 text-sm font-semibold bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            message
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {userPosts.map(post => (
            <div key={post.id} className="aspect-square bg-gray-100 overflow-hidden">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
