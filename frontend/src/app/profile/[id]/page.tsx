"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import ThemeToggle from "@/components/ThemeToggle"

type Profile = {
  id: number
  username: string
  email: string
  account_status?: string
  bio?: string
  profile_pic?: string
  posts_count: number
  followers_count: number
  following_count: number
  is_following: boolean
}

type Post = {
  id: number
  user_id: number
  image_url: string
  title: string
}

export default function UserProfile() {
  const { token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return router.push("/login")
    const userId = Number(params.id)
    if (!userId) { setError("Invalid user"); return }
    api.getUserProfile(userId, token).then(setProfile).catch(() => setError("User not found"))
  }, [token, router, params.id])

  useEffect(() => {
    if (!token || !profile) return
    api.getPosts(token).then(all => {
      setUserPosts(all.filter((p: Post) => p.user_id === profile.id))
    }).catch(() => {})
  }, [token, profile])

  const handleFollow = async () => {
    if (!token || !profile) return
    try {
      if (profile.is_following) {
        await api.unfollowUser(profile.id, token)
        setProfile({ ...profile, is_following: false, followers_count: profile.followers_count - 1 })
      } else {
        await api.followUser(profile.id, token)
        setProfile({ ...profile, is_following: true, followers_count: profile.followers_count + 1 })
      }
    } catch {}
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">{error}</p>
    </div>
  )

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <nav className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <Link href="/">Home</Link>
            <Link href="/chat">Chat</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-6 mb-6">
          {profile.profile_pic ? (
            <img src={getImageUrl(profile.profile_pic)} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-light">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile.username}</h2>
            <div className="flex gap-6 mt-3 text-sm">
              <span><strong>{profile.posts_count}</strong> posts</span>
              <span><strong>{profile.followers_count}</strong> followers</span>
              <span><strong>{profile.following_count}</strong> following</span>
            </div>
          </div>
        </div>

        {profile.account_status && (
          <div className="mb-3 px-3 py-2 rounded-lg text-sm font-semibold text-center"
            style={{
              backgroundColor: profile.account_status === "Account Band" ? "var(--color-status-band-bg)" : profile.account_status === "Restricted" ? "var(--color-status-restricted-bg)" : "var(--color-status-warning-bg)",
              color: profile.account_status === "Account Band" ? "var(--color-status-band-text)" : profile.account_status === "Restricted" ? "var(--color-status-restricted-text)" : "var(--color-status-warning-text)"
            }}>
            {profile.account_status}
          </div>
        )}
        <p className="text-sm mb-4">{profile.bio || "I am A penter"}</p>

        <div className="flex gap-2 mb-6">
          <button onClick={handleFollow}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
              profile.is_following
                ? "bg-gray-100 hover:bg-gray-200"
                : "bg-accent text-white hover:bg-blue-600"
            }`}>
            {profile.is_following ? "Following" : "Follow"}
          </button>
          <Link href={`/chat?user=${profile.id}`}
            className="flex-1 py-1.5 text-sm font-semibold text-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            Message
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {userPosts.map(post => (
            <Link key={post.id} href={`/post/${post.id}`} className="aspect-square bg-gray-100 overflow-hidden">
              <img src={getImageUrl(post.image_url)} alt={post.title} className="w-full h-full object-cover" />
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
