"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export default function EditProfile() {
  const { token } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [profilePic, setProfilePic] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [picHover, setPicHover] = useState(false)

  useEffect(() => {
    if (!token) return router.push("/login")
    api.getProfile(token).then(p => {
      setUsername(p.username)
      setBio(p.bio || "")
      setProfilePic(p.profile_pic || "")
    }).catch(() => router.push("/login"))
  }, [token, router])

  const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files?.[0]) return
    try {
      const res = await api.uploadProfilePic(e.target.files[0], token)
      setProfilePic(res.profile_pic)
    } catch {}
  }

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

          <div className="flex justify-center">
            <div
              className="relative cursor-pointer"
              onMouseEnter={() => setPicHover(true)}
              onMouseLeave={() => setPicHover(false)}
              onClick={() => fileRef.current?.click()}
            >
              {profilePic ? (
                <img src={getImageUrl(profilePic)} className="w-24 h-24 rounded-full object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-light">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              {picHover && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
            </div>
          </div>

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
