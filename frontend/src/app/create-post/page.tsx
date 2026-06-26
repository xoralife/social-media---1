"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export default function CreatePost() {
  const { token } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ title: "", caption: "", image_url: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (!token) {
    router.push("/login")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.createPost(form, token)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">SocialApp</Link>
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Create a Post</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-border space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caption (optional)</label>
            <textarea rows={3} value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input type="url" required value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          {form.image_url && (
            <img src={form.image_url} alt="Preview" className="w-full h-48 object-cover rounded-xl" onError={(e: any) => e.target.style.display = "none"} />
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50">
            {loading ? "Creating..." : "Create Post"}
          </button>
        </form>
      </main>
    </div>
  )
}
