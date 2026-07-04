"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import Navbar from "@/components/Navbar"

type Post = {
  id: number
  user_id: number
  title: string
  caption?: string
  image_url: string
  media_type?: string
  username: string
  profile_pic?: string | null
  like_count: number
  comment_count: number
  is_liked: boolean
  is_favorited: boolean
}

export default function Home() {
  const { token, user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    if (!token) return
    api.getPosts(token).then(setPosts).catch(() => setPosts([]))
  }, [token])

  const handleLike = async (post: Post) => {
    if (!token) return
    if (post.user_id === user?.id) return
    try {
      if (post.is_liked) {
        await api.unlikePost(post.id, token)
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_liked: false, like_count: p.like_count - 1 } : p))
      } else {
        await api.likePost(post.id, token)
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_liked: true, like_count: p.like_count + 1 } : p))
      }
    } catch {}
  }

  const handleFavorite = async (post: Post) => {
    if (!token) return
    try {
      if (post.is_favorited) {
        await api.unfavoritePost(post.id, token)
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_favorited: false } : p))
      } else {
        await api.favoritePost(post.id, token)
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_favorited: true } : p))
      }
    } catch {}
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            <h2 className="text-4xl font-bold tracking-tight">Share your <span className="italic">moments</span></h2>
            <p className="mt-4 text-sm text-gray-500">A modern social platform to share posts, like, and comment with friends.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <Link href="/register" className="bg-black text-white px-6 py-2 rounded-lg text-sm font-semibold">Get Started</Link>
              <Link href="/login" className="border border-border px-6 py-2 rounded-lg text-sm font-semibold">Sign In</Link>
            </div>
            <Link href="/admin/login" className="mt-6 inline-block text-xs text-gray-400 hover:text-gray-600">Admin Login</Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar>
        <Link href="/create-post">Create</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/chat">Chat</Link>
      </Navbar>

      <div className="max-w-xl mx-auto px-4 space-y-4 pb-8 pt-4">
        {posts.length === 0 && (
          <p className="text-gray-400 text-center py-8 text-sm">No posts yet. Create one!</p>
        )}
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {post.profile_pic ? (
                  <img src={getImageUrl(post.profile_pic)} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                    {post.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <Link href={`/profile/${post.user_id}`} className="text-sm font-semibold">{post.username}</Link>
              </div>
            </div>
            <Link href={`/post/${post.id}`}>
              {post.media_type === "video" ? (
                <video src={getImageUrl(post.image_url)} className="w-full aspect-square object-cover" />
              ) : (
                <img src={getImageUrl(post.image_url)} alt={post.title} className="w-full aspect-square object-cover" />
              )}
            </Link>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-4">
                <button onClick={() => handleLike(post)} className="text-lg">
                  {post.is_liked ? "❤️" : "🤍"}
                </button>
                <Link href={`/post/${post.id}`} className="text-lg">💬</Link>
                <button onClick={() => handleFavorite(post)} className="text-lg ml-auto">
                  {post.is_favorited ? "★" : "☆"}
                </button>
              </div>
              <p className="text-sm font-semibold">{post.like_count} likes</p>
              <p className="text-sm">
                <Link href={`/profile/${post.user_id}`} className="font-semibold mr-1">{post.username}</Link>
                {post.caption || post.title}
              </p>
              <Link href={`/post/${post.id}`} className="text-sm text-gray-500 block">
                View all {post.comment_count} comments
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
