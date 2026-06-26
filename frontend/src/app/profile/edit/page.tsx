"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export default function EditProfile() {
  const { token } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return router.push("/login")
    api.getProfile(token).then(p => {
      setUsername(p.username)
      setBio(p.bio || "")
    }).catch(() => router.push("/login"))
  }, [token, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError("")
    setLoading(true)
    try {
      await api.updateProfile({ username, bio }, token)
      router.push("/profile")
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
          <Link href="/profile" className="text-sm">Cancel</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <input type="text" required placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <textarea rows={3} placeholder="Bio" value={bio}
            onChange={e => setBio(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400 resize-none" />
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
      </main>
    </div>
  )
}
