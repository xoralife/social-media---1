"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import ThemeToggle from "@/components/ThemeToggle"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

type User = { id: number; username: string; email: string; account_status?: string }
type Post = { id: number; user_id: number; title: string; caption?: string; image_url: string }
type Analytics = {
  total_users: number; total_posts: number; total_likes: number; total_comments: number; total_follows: number
  user_status_breakdown: Record<string, number>
  top_liked_posts: { id: number; title: string; likes: number }[]
  top_commented_posts: { id: number; title: string; comments: number }[]
  most_followed_users: { id: number; username: string; profile_pic: string | null; followers: number }[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [tab, setTab] = useState<"users" | "posts" | "analytics">("users")
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
      api.adminAnalytics(token),
    ])
      .then(([u, p, a]) => { setUsers(u); setPosts(p); setAnalytics(a) })
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
          <button onClick={() => setTab("analytics")}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === "analytics" ? "bg-black text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}>
            Analytics
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

        {tab === "analytics" && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "Users", value: analytics.total_users, color: "from-blue-500/90 to-blue-600", icon: "👥", sub: "Registered accounts" },
                { label: "Posts", value: analytics.total_posts, color: "from-violet-500/90 to-violet-600", icon: "📸", sub: "Total shared" },
                { label: "Likes", value: analytics.total_likes, color: "from-rose-500/90 to-rose-600", icon: "❤️", sub: "Total reactions" },
                { label: "Comments", value: analytics.total_comments, color: "from-emerald-500/90 to-emerald-600", icon: "💬", sub: "Total discussions" },
                { label: "Follows", value: analytics.total_follows, color: "from-amber-500/90 to-amber-600", icon: "🔗", sub: "Total connections" },
              ].map((card, i) => (
                <div key={card.label} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5" style={{ backgroundColor: card.color }}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-100`} />
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative p-5 text-white">
                    <p className="text-3xl font-bold tracking-tight">{card.value.toLocaleString()}</p>
                    <p className="text-xs font-medium text-white/70 mt-1.5">{card.icon} {card.label}</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-800">User Status</h3>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Distribution</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="shrink-0">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={Object.entries(analytics.user_status_breakdown).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={4} strokeWidth={0}>
                          {Object.entries(analytics.user_status_breakdown).map(([name], i) => {
                            const colors = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]
                            return <Cell key={name} fill={colors[i % 4]} />
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {Object.entries(analytics.user_status_breakdown).map(([name, value], i) => {
                      const colors = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]
                      const total = Object.values(analytics.user_status_breakdown).reduce((a, b) => a + b, 0)
                      const pct = total > 0 ? Math.round((value / total) * 100) : 0
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % 4] }} />
                              <span className="text-gray-600 font-medium">{name}</span>
                            </div>
                            <span className="font-semibold text-gray-800">{value} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i % 4] }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-800">Top Followed</h3>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Users</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.most_followed_users.map(u => ({ name: u.username, followers: u.followers }))} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="followGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} cursor={{ fill: "rgba(139,92,246,0.05)" }} />
                    <Bar dataKey="followers" fill="url(#followGrad)" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-800">Top Liked</h3>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Posts</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.top_liked_posts.map(p => ({ name: p.title.length > 16 ? p.title.slice(0, 16) + "…" : p.title, likes: p.likes }))} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="likeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#f472b6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} cursor={{ fill: "rgba(236,72,153,0.05)" }} />
                    <Bar dataKey="likes" fill="url(#likeGrad)" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-800">Top Commented</h3>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Posts</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.top_commented_posts.map(p => ({ name: p.title.length > 16 ? p.title.slice(0, 16) + "…" : p.title, comments: p.comments }))} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="commentGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} cursor={{ fill: "rgba(16,185,129,0.05)" }} />
                    <Bar dataKey="comments" fill="url(#commentGrad)" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
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
