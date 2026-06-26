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
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Admin</span>
            <button onClick={handleLogout} className="text-red-500">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6">Admin Dashboard</h2>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("users")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === "users" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}>
            Users ({users.length})
          </button>
          <button onClick={() => setTab("posts")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === "posts" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}>
            Posts ({posts.length})
          </button>
        </div>

        {tab === "users" && (
          <div className="border border-border rounded-lg overflow-hidden">
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
          <div className="grid gap-3">
            {posts.map(post => (
              <div key={post.id} className="border border-border rounded-lg overflow-hidden flex">
                <img src={post.image_url} alt={post.title} className="w-32 h-24 object-cover flex-shrink-0" />
                <div className="p-3 flex-1">
                  <p className="text-xs text-gray-400">Post #{post.id} by User #{post.user_id}</p>
                  <h3 className="font-semibold text-sm mt-0.5">{post.title}</h3>
                  {post.caption && <p className="text-xs text-gray-500 mt-0.5">{post.caption}</p>}
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-gray-400 text-center py-8 text-sm">No posts yet.</p>}
          </div>
        )}
      </main>
    </div>
  )
}
