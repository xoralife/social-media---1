"use client"

import { useEffect, useState, useRef } from "react"
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
  const [search, setSearch] = useState("")
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null

  const fetchData = (term?: string) => {
    if (!token) return
    Promise.all([
      api.adminUsers(token, term),
      api.adminPosts(token, term),
      api.adminAnalytics(token),
    ])
      .then(([u, p, a]) => { setUsers(u); setPosts(p); setAnalytics(a) })
      .catch(() => router.push("/admin/login"))
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => fetchData(value || undefined), 300)
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <div className="relative w-72">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search users & posts..." value={search} onChange={e => handleSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400 bg-white" />
            {search && (
              <button onClick={() => handleSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

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
          <div>
            {users.length === 0 && search ? (
              <p className="text-gray-400 text-center py-8 text-sm">No users matching &quot;{search}&quot;</p>
            ) : (
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
            {posts.length === 0 && !search && <p className="text-gray-400 text-center py-8 text-sm">No posts yet.</p>}
            {posts.length === 0 && search && <p className="text-gray-400 text-center py-8 text-sm">No posts matching &quot;{search}&quot;</p>}
          </div>
        )}

        {tab === "analytics" && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "Users", value: analytics.total_users, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-50", iconColor: "text-violet-600", sub: "Registered accounts" },
                { label: "Posts", value: analytics.total_posts, gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-50", iconColor: "text-blue-600", sub: "Total shared" },
                { label: "Likes", value: analytics.total_likes, gradient: "from-rose-500 to-pink-500", bg: "bg-rose-50", iconColor: "text-rose-600", sub: "Total reactions" },
                { label: "Comments", value: analytics.total_comments, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50", iconColor: "text-emerald-600", sub: "Total discussions" },
                { label: "Follows", value: analytics.total_follows, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50", iconColor: "text-amber-600", sub: "Total connections" },
              ].map((card) => (
                <div key={card.label} className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 p-5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl ${card.bg} dark:bg-opacity-20 flex items-center justify-center ${card.iconColor} dark:brightness-150`}>
                      {card.label === "Users" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      ) : card.label === "Posts" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      ) : card.label === "Likes" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      ) : card.label === "Comments" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><polyline points="17 8 21 12 17 16"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      )}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value.toLocaleString()}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/80 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">User Status</h3>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">Distribution</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="shrink-0 relative">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={Object.entries(analytics.user_status_breakdown).map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={4} strokeWidth={0}>
                          {Object.entries(analytics.user_status_breakdown).map(([name], i) => {
                            const colors = ["#6366f1", "#8b5cf6", "#14b8a6", "#f59e0b"]
                            return <Cell key={name} fill={colors[i % colors.length]} />
                          })}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{Object.values(analytics.user_status_breakdown).reduce((a, b) => a + b, 0)}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 -mt-0.5">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    {Object.entries(analytics.user_status_breakdown).map(([name, value], i) => {
                      const colors = ["#6366f1", "#8b5cf6", "#14b8a6", "#f59e0b"]
                      const total = Object.values(analytics.user_status_breakdown).reduce((a, b) => a + b, 0)
                      const pct = total > 0 ? Math.round((value / total) * 100) : 0
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                              <span className="text-gray-600 dark:text-gray-300 font-medium">{name}</span>
                            </div>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">{value} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/80 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Top Followed</h3>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">Users</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analytics.most_followed_users.map(u => ({ name: u.username, followers: u.followers }))} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="followGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#818cf8" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} cursor={{ fill: "rgba(99,102,241,0.05)" }} formatter={(value) => [value, "Followers"]} />
                    <Bar dataKey="followers" fill="url(#followGrad)" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/80 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Top Liked</h3>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">Posts</span>
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
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} cursor={{ fill: "rgba(236,72,153,0.05)" }} formatter={(value) => [value, "Likes"]} />
                    <Bar dataKey="likes" fill="url(#likeGrad)" radius={[0, 6, 6, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/80 p-6 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Top Commented</h3>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1 rounded-full">Posts</span>
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
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#64748b", fontWeight: 500 }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} cursor={{ fill: "rgba(16,185,129,0.05)" }} formatter={(value) => [value, "Comments"]} />
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
