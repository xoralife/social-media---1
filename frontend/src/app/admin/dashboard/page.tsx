"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import ThemeToggle from "@/components/ThemeToggle"

type User = { id: number; username: string; email: string; account_status?: string }
type Post = { id: number; user_id: number; title: string; caption?: string; image_url: string }

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState<"users" | "posts">("users")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editUsername, setEditUsername] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editBio, setEditBio] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null

  const fetchData = () => {
    if (!token) return
    Promise.all([
      api.adminUsers(token),
      api.adminPosts(token),
    ])
      .then(([u, p]) => { setUsers(u); setPosts(p) })
      .catch(() => router.push("/admin/login"))
  }

  useEffect(() => {
    if (!token) return router.push("/admin/login")
    fetchData()
  }, [token, router])

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    router.push("/admin/login")
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setEditUsername(user.username)
    setEditEmail(user.email)
    setEditStatus(user.account_status || "")
    setEditBio("")
  }

  const handleEdit = async () => {
    if (!editingUser || !token) return
    setEditLoading(true)
    try {
      await api.adminUpdateUser(editingUser.id, { username: editUsername, email: editEmail, account_status: editStatus, bio: editBio }, token)
      setEditingUser(null)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!token) return
    if (!confirm("Delete this user account? This cannot be undone.")) return
    try {
      await api.adminDeleteUser(userId, token)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!token) return
    if (!confirm("Delete this post?")) return
    try {
      await api.adminDeletePost(postId, token)
      fetchData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
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
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border hover:bg-gray-50">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.account_status ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: u.account_status === "Account Band" ? "var(--color-status-band-bg)" : u.account_status === "Restricted" ? "var(--color-status-restricted-bg)" : "var(--color-status-warning-bg)",
                            color: u.account_status === "Account Band" ? "var(--color-status-band-text)" : u.account_status === "Restricted" ? "var(--color-status-restricted-text)" : "var(--color-status-warning-text)"
                          }}>
                          {u.account_status}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </td>
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
                <div className="p-3 flex-1 flex flex-col justify-center">
                  <p className="text-xs text-gray-400">Post #{post.id} by User #{post.user_id}</p>
                  <h3 className="font-semibold text-sm mt-0.5">{post.title}</h3>
                  {post.caption && <p className="text-xs text-gray-500 mt-0.5">{post.caption}</p>}
                  <div className="mt-2">
                    <button onClick={() => handleDeletePost(post.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-gray-400 text-center py-8 text-sm">No posts yet.</p>}
          </div>
        )}
      </main>

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Edit User #{editingUser.id}</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Username" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
              <input type="email" placeholder="Email" value={editEmail} onChange={e => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400">
                <option value="">Normal</option>
                <option value="Warning">Warning</option>
                <option value="Restricted">Restricted</option>
                <option value="Account Band">Account Band</option>
              </select>
              <textarea placeholder="Bio" value={editBio} onChange={e => setEditBio(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400 resize-none" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditingUser(null)} className="flex-1 py-2 rounded-lg text-sm border border-border">Cancel</button>
              <button onClick={handleEdit} disabled={editLoading} className="flex-1 py-2 rounded-lg text-sm bg-black text-white disabled:opacity-50">
                {editLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
