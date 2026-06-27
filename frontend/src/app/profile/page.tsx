"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

type Profile = {
  id: number
  username: string
  email: string
  bio?: string
  profile_pic?: string
  posts_count: number
  followers_count: number
  following_count: number
}

type Post = {
  id: number
  image_url: string
  title: string
}

export default function MyProfile() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [picHover, setPicHover] = useState(false)

  useEffect(() => {
    if (!token) return router.push("/login")
    api.getProfile(token).then(setProfile).catch(() => router.push("/login"))
  }, [token, router])

  useEffect(() => {
    if (!token || !profile) return
    api.getPosts(token).then(all => {
      setMyPosts(all.filter((p: any) => p.user_id === profile.id))
    }).catch(() => {})
  }, [token, profile])

  const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files?.[0]) return
    try {
      const res = await api.uploadProfilePic(e.target.files[0], token)
      setProfile(prev => prev ? { ...prev, profile_pic: res.profile_pic } : prev)
    } catch {}
  }

  const handleDeletePost = async (postId: number) => {
    if (!token) return
    try {
      await api.deletePost(postId, token)
      setMyPosts(prev => prev.filter(p => p.id !== postId))
    } catch {}
  }

  const handleDeleteAccount = async () => {
    if (!token) return
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return
    try {
      await api.deleteAccount(token)
      logout()
      router.push("/")
    } catch {}
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/">Home</Link>
            <Link href="/create-post">Create</Link>
            <Link href="/chat">Chat</Link>
            <Link href="/profile/edit">Edit</Link>
            <button onClick={() => { logout(); router.push("/") }} className="text-red-500">Logout</button>
          </nav>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-6 mb-6">
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setPicHover(true)}
            onMouseLeave={() => setPicHover(false)}
            onClick={() => fileRef.current?.click()}
          >
            {profile.profile_pic ? (
              <img src={getImageUrl(profile.profile_pic)} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-light">
                {profile.username.charAt(0).toUpperCase()}
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
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile.username}</h2>
            <div className="flex gap-6 mt-3 text-sm">
              <span><strong>{profile.posts_count}</strong> posts</span>
              <span><strong>{profile.followers_count}</strong> followers</span>
              <span><strong>{profile.following_count}</strong> following</span>
            </div>
          </div>
        </div>

        <p className="text-sm mb-4">{profile.bio || "I am A penter"}</p>

        <div className="flex gap-2 mb-6">
          <Link href="/profile/edit"
            className="flex-1 py-1.5 text-sm font-semibold text-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Edit Profile
          </Link>
          <button onClick={handleDeleteAccount}
            className="py-1.5 px-4 text-sm font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            Delete Account
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {myPosts.map(post => (
            <div key={post.id} className="relative group aspect-square bg-gray-100 overflow-hidden">
              <Link href={`/post/${post.id}`}>
                <img src={getImageUrl(post.image_url)} alt={post.title} className="w-full h-full object-cover" />
              </Link>
              <button
                onClick={() => handleDeletePost(post.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
