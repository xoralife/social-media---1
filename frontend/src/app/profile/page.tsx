"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  image_url: string
  title: string
}

export default function MyProfile() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myPosts, setMyPosts] = useState<Post[]>([])

  useEffect(() => {
    if (!token) return router.push("/login")
    api.getProfile(token).then(setProfile).catch(() => router.push("/login"))
  }, [token, router])

  useEffect(() => {
    if (!token || !profile) return
    api.getPosts(token).then(all => {
      setMyPosts(all.filter((p: any) => p.user_id === profile.id))
    }).catch(() => {})
  }, [token, profile])

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/create-post">Create</Link>
            <button onClick={() => { logout(); router.push("/") }} className="text-red-500">Logout</button>
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
            <p className="text-xs text-gray-500 mt-1">{profile.email}</p>
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
          {myPosts.map(post => (
            <div key={post.id} className="aspect-square bg-gray-100 overflow-hidden">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
