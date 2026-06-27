"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import ThemeToggle from "@/components/ThemeToggle"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { setToken } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await api.login({ email, password })
      setToken(data.access_token)
      localStorage.setItem("token", data.access_token)
      router.push("/dashboard")
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
          <p className="text-sm text-gray-500 mt-2">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <input type="email" required placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <input type="password" required placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading ? "Loading..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account? <Link href="/register" className="font-semibold hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
