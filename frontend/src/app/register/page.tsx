"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import ThemeToggle from "@/components/ThemeToggle"

export default function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.register(form)
      router.push("/login")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 relative">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold">SocialApp</Link>
          <p className="text-sm text-gray-500 mt-2">Create a new account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <input type="text" required placeholder="Username" value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <input type="email" required placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <input type="password" required minLength={6} placeholder="Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading ? "Loading..." : "Register"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Already have an account? <Link href="/login" className="font-semibold hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
