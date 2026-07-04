"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
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
}

type Post = {
  id: number
  user_id: number
  image_url: string
  title: string
  media_type?: string
  like_count: number
  comment_count: number
  is_liked: boolean
  is_favorited: boolean
}

type Tab = "posts" | "likes" | "favorites"

export default function MyProfile() {
  const { token, logout, setUser } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [favPosts, setFavPosts] = useState<Post[]>([])
  const [activeTab, setActiveTab] = useState<Tab>("posts")
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

  useEffect(() => {
    if (!token) return
    if (activeTab === "likes") {
      api.getLikedPosts(token).then(setLikedPosts).catch(() => {})
    } else if (activeTab === "favorites") {
      api.getFavorites(token).then(setFavPosts).catch(() => {})
    }
  }, [token, activeTab])

  const handlePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files?.[0]) return
    try {
      const res = await api.uploadProfilePic(e.target.files[0], token)
      setProfile(prev => prev ? { ...prev, profile_pic: res.profile_pic } : prev)
      setUser(prev => prev ? { ...prev, profile_pic: res.profile_pic } : null)
    } catch {}
  }

  const handleDeletePost = async (postId: number) => {
    if (!token) return
    try {
      await api.deletePost(postId, token)
      setMyPosts(prev => prev.filter(p => p.id !== postId))
    } catch {}
  }

  const handleLikeToggle = async (post: Post) => {
    if (!token) return
    if (post.user_id === profile?.id) return
    try {
      if (post.is_liked) {
        await api.unlikePost(post.id, token)
      } else {
        await api.likePost(post.id, token)
      }
      const updatePost = (p: Post) => p.id === post.id ? { ...p, is_liked: !p.is_liked, like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1 } : p
      setMyPosts(prev => prev.map(updatePost))
      setLikedPosts(prev => prev.map(updatePost))
      setFavPosts(prev => prev.map(updatePost))
    } catch {}
  }

  const handleFavToggle = async (post: Post) => {
    if (!token) return
    try {
      if (post.is_favorited) {
        await api.unfavoritePost(post.id, token)
      } else {
        await api.favoritePost(post.id, token)
      }
      const updatePost = (p: Post) => p.id === post.id ? { ...p, is_favorited: !p.is_favorited } : p
      setMyPosts(prev => prev.map(updatePost))
      setLikedPosts(prev => prev.map(updatePost))
      setFavPosts(prev => prev.filter(p => p.id !== post.id))
    } catch {}
  }

  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [followList, setFollowList] = useState<{ id: number; username: string; profile_pic: string | null; is_following: boolean }[]>([])

  const openFollowers = async () => {
    if (!token) return
    try {
      const data = await api.getFollowers(token)
      setFollowList(data)
      setShowFollowers(true)
    } catch {}
  }

  const openFollowing = async () => {
    if (!token) return
    try {
      const data = await api.getFollowing(token)
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
      setProfile(prev => prev ? { ...prev, followers_count: isFollowing ? prev.followers_count - 1 : prev.followers_count + 1 } : prev)
    } catch {}
  }

  const getDisplayPosts = () => {
    if (activeTab === "likes") return likedPosts
    if (activeTab === "favorites") return favPosts
    return myPosts
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-white">
      <Navbar>
        <Link href="/">Home</Link>
        <Link href="/create-post">Create</Link>
        <Link href="/chat">Chat</Link>
      </Navbar>

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

        <Link href="/profile/edit"
          className="block w-full py-1.5 text-sm font-semibold text-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mb-6">
          Edit Profile
        </Link>

        <div className="flex border-b border-border mb-4">
          {(["posts", "likes", "favorites"] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                activeTab === tab ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              {tab === "posts" ? "Posts" : tab === "likes" ? "Likes" : "Favorites"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1">
          {getDisplayPosts().length === 0 && (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-400 text-sm">No {activeTab} yet.</p>
            </div>
          )}
          {getDisplayPosts().map(post => (
            <div key={post.id} className="relative group aspect-square bg-gray-100 overflow-hidden">
              <Link href={`/post/${post.id}`}>
                {post.media_type === "video" ? (
                  <video src={getImageUrl(post.image_url)} className="w-full h-full object-cover" />
                ) : (
                  <img src={getImageUrl(post.image_url)} alt={post.title} className="w-full h-full object-cover" />
                )}
              </Link>
              {activeTab === "posts" && (
                <button onClick={() => handleDeletePost(post.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  ×
                </button>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="absolute bottom-1 left-1 right-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {post.user_id !== profile.id && (
                  <button onClick={(e) => { e.preventDefault(); handleLikeToggle(post) }}
                    className="text-xs bg-white/80 rounded px-1.5 py-0.5">
                    {post.is_liked ? "❤️" : "🤍"} {post.like_count}
                  </button>
                )}
                <button onClick={(e) => { e.preventDefault(); handleFavToggle(post) }}
                  className="text-xs bg-white/80 rounded px-1.5 py-0.5">
                  {post.is_favorited ? "★" : "☆"}
                </button>
              </div>
            </div>
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
