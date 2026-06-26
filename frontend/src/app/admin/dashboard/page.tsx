"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"

type User = { id: number; username: string; email: string }
type Post = { id: number; user_id: number; title: string; caption?: string; image_url: string }

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState<"users" | "posts">("users")

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null

  useEffect(() => {
    if (!token) return router.push("/admin/login")
    Promise.all([
      api.adminUsers(token),
      api.adminPosts(token),
    ])
      .then(([u, p]) => { setUsers(u); setPosts(p) })
      .catch(() => router.push("/admin/login"))
  }, [token, router])

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">SocialApp</Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Admin</span>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-600">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("users")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "users" ? "bg-primary text-white" : "bg-white border border-border hover:bg-gray-50"}`}>
            Users ({users.length})
          </button>
          <button onClick={() => setTab("posts")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === "posts" ? "bg-primary text-white" : "bg-white border border-border hover:bg-gray-50"}`}>
            Posts ({posts.length})
          </button>
        </div>

        {tab === "users" && (
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Username</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border hover:bg-gray-50">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "posts" && (
          <div className="grid gap-4">
            {posts.map(post => (
              <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border flex">
                <img src={post.image_url} alt={post.title} className="w-40 h-32 object-cover flex-shrink-0" />
                <div className="p-4 flex-1">
                  <p className="text-xs text-gray-400">Post #{post.id} by User #{post.user_id}</p>
                  <h3 className="font-semibold mt-1">{post.title}</h3>
                  {post.caption && <p className="text-sm text-gray-500 mt-1">{post.caption}</p>}
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-gray-400 text-center py-8">No posts yet.</p>}
          </div>
        )}
      </main>
    </div>
  )
}
