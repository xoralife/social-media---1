"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

type Post = {
  id: number
  user_id: number
  title: string
  caption?: string
  image_url: string
  username: string
  like_count: number
  comment_count: number
  is_liked: boolean
}

type Comment = {
  id: number
  user_id: number
  post_id: number
  comment: string
}

const categories = ["photo", "Clothes", "Painting", "Comic"]

export default function Dashboard() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({})
  const [activeCategory, setActiveCategory] = useState("photo")

  useEffect(() => {
    if (!token) return router.push("/login")
    api.getPosts(token)
      .then(setPosts)
      .catch(() => setPosts([]))
  }, [token, router])

  const handleLike = async (postId: number) => {
    if (!token) return
    try {
      await api.likePost(postId, token)
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, is_liked: true, like_count: p.like_count + 1 } : p
      ))
    } catch {}
  }

  const toggleComments = async (postId: number) => {
    if (!token) return
    if (expandedPosts[postId]) {
      setExpandedPosts(prev => ({ ...prev, [postId]: false }))
      return
    }
    try {
      const data = await api.getComments(postId, token)
      setComments(prev => ({ ...prev, [postId]: data }))
      setExpandedPosts(prev => ({ ...prev, [postId]: true }))
    } catch {}
  }

  const handleComment = async (postId: number) => {
    if (!token || !commentInputs[postId]?.trim()) return
    try {
      await api.comment({ post_id: postId, comment: commentInputs[postId] }, token)
      setCommentInputs(prev => ({ ...prev, [postId]: "" }))
      const data = await api.getComments(postId, token)
      setComments(prev => ({ ...prev, [postId]: data }))
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      ))
    } catch {}
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/create-post">Create</Link>
            <Link href="/profile">Profile</Link>
            <button onClick={() => { logout(); router.push("/") }} className="text-red-500">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-0">
        <div className="bg-white border-b border-border flex gap-1 px-4 py-3">
          {categories.map(cat => (
            <button key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeCategory === cat ? "bg-gray-900 text-white" : "bg-white text-gray-700 border border-border"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="pt-4 space-y-4 px-4">
          {posts.length === 0 && <p className="text-gray-400 text-center py-12 text-sm">No posts yet.</p>}
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                  {post.username.charAt(0).toUpperCase()}
                </div>
                <Link href={`/profile/${post.user_id}`} className="text-sm font-semibold">
                  {post.username}
                </Link>
              </div>
              <img src={post.image_url} alt={post.title} className="w-full aspect-square object-cover" />
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleLike(post.id)} className="text-lg">
                    {post.is_liked ? "❤️" : "🤍"}
                  </button>
                  <button onClick={() => toggleComments(post.id)} className="text-lg">
                    💬
                  </button>
                </div>
                <p className="text-sm font-semibold">{post.like_count} likes</p>
                <p className="text-sm">
                  <Link href={`/profile/${post.user_id}`} className="font-semibold mr-1">{post.username}</Link>
                  {post.caption || post.title}
                </p>
                {post.comment_count > 0 && (
                  <button onClick={() => toggleComments(post.id)} className="text-sm text-gray-500">
                    View all {post.comment_count} comments
                  </button>
                )}
                {expandedPosts[post.id] && (
                  <div className="pt-2 border-t border-border space-y-2">
                    {comments[post.id]?.map(c => (
                      <p key={c.id} className="text-sm">
                        <span className="font-semibold">User #{c.user_id}</span> {c.comment}
                      </p>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <input
                        value={commentInputs[post.id] || ""}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Add a comment..."
                        className="flex-1 text-sm outline-none"
                        onKeyDown={e => { if (e.key === "Enter") handleComment(post.id) }}
                      />
                      <button onClick={() => handleComment(post.id)}
                        className="text-sm font-semibold text-accent hover:text-blue-600">
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
