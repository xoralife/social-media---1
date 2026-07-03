"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import Navbar from "@/components/Navbar"

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

  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [followList, setFollowList] = useState<{ id: number; username: string; profile_pic: string | null; is_following: boolean }[]>([])

  const openFollowers = async () => {
    if (!token || !profile) return
    try {
      const data = await api.getUserFollowers(profile.id, token)
      setFollowList(data)
      setShowFollowers(true)
    } catch {}
  }

  const openFollowing = async () => {
    if (!token || !profile) return
    try {
      const data = await api.getUserFollowing(profile.id, token)
      setFollowList(data)
      setShowFollowing(true)
    } catch {}
  }

  const handleFollowUser = async (userId: number, isFollowing: boolean) => {
    if (!token) return
    try {
      if (isFollowing) {
        await api.unfollowUser(userId, token)
        setFollowList(prev => prev.map(u => u.id === userId ? { ...u, is_following: false } : u))
      } else {
        await api.followUser(userId, token)
        setFollowList(prev => prev.map(u => u.id === userId ? { ...u, is_following: true } : u))
      }
      if (profile && profile.id === userId) {
        setProfile({ ...profile, is_following: !isFollowing, followers_count: isFollowing ? profile.followers_count - 1 : profile.followers_count + 1 })
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

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
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">{error}</p>
    </div>
  )

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      <Navbar>
        <Link href="/">Home</Link>
        <Link href="/chat">Chat</Link>
      </Navbar>

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
              <button onClick={openFollowers} className="hover:underline"><strong>{profile.followers_count}</strong> followers</button>
              <button onClick={openFollowing} className="hover:underline"><strong>{profile.following_count}</strong> following</button>
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

      {(showFollowers || showFollowing) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => { setShowFollowers(false); setShowFollowing(false) }}>
          <div className="bg-white rounded-xl p-4 w-full max-w-sm mx-4 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">{showFollowers ? "Followers" : "Following"}</h3>
              <button onClick={() => { setShowFollowers(false); setShowFollowing(false) }} className="text-lg leading-none">&times;</button>
            </div>
            {followList.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No {showFollowers ? "followers" : "following"} yet.</p>}
            {followList.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2">
                <Link href={`/profile/${u.id}`} className="flex items-center gap-2 flex-1 min-w-0" onClick={() => { setShowFollowers(false); setShowFollowing(false) }}>
                  {u.profile_pic ? (
                    <img src={getImageUrl(u.profile_pic)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium truncate">{u.username}</span>
                </Link>
                <button onClick={() => handleFollowUser(u.id, u.is_following)}
                  className={`text-sm font-semibold px-3 py-1 rounded-lg ${
                    u.is_following ? "bg-gray-100 hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"
                  }`}>
                  {u.is_following ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
