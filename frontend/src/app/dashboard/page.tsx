"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

type Post = { id: number; title: string; caption?: string; image_url: string }

export default function Dashboard() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    if (!token) return router.push("/login")
    api.getPosts(token)
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [token, router])

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">SocialApp</Link>
          <nav className="flex items-center gap-4">
            <Link href="/create-post" className="text-sm font-medium hover:text-primary transition-colors">Create Post</Link>
            <button onClick={() => { logout(); router.push("/") }} className="text-sm text-red-500 hover:text-red-600">Logout</button>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold">Your Feed</h2>
        {posts.length === 0 && <p className="text-gray-400 text-center py-12">No posts yet. Create one!</p>}
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
            <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{post.title}</h3>
              {post.caption && <p className="text-gray-500 text-sm mt-1">{post.caption}</p>}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
