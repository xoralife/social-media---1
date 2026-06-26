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
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <Link href="/dashboard" className="text-sm">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6">Create a Post</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input type="text" required placeholder="Title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <textarea rows={3} placeholder="Caption (optional)" value={form.caption}
            onChange={e => setForm({ ...form, caption: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400 resize-none" />
          <input type="url" required placeholder="Image URL" value={form.image_url}
            onChange={e => setForm({ ...form, image_url: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          {form.image_url && (
            <img src={form.image_url} alt="Preview" className="w-full aspect-square object-cover rounded-lg"
              onError={(e: any) => e.target.style.display = "none"} />
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading ? "Creating..." : "Create Post"}
          </button>
        </form>
      </main>
    </div>
  )
}
