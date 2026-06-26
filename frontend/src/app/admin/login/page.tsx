"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"

export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await api.adminLogin({ username, password })
      localStorage.setItem("admin_token", data.access_token)
      router.push("/admin/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">SocialApp</Link>
          <p className="text-sm text-gray-500 mt-2">Admin Login</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <input type="text" required placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <input type="password" required placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading ? "Loading..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
