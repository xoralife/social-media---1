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

export default function Dashboard() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Record<number, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({})

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
      <header className="border-b border-border bg-white">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">SocialApp</Link>
          <nav className="flex items-center gap-4">
            <Link href="/create-post" className="text-sm font-medium hover:text-primary transition-colors">Create Post</Link>
            <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">Profile</Link>
            <button onClick={() => { logout(); router.push("/") }} className="text-sm text-red-500 hover:text-red-600">Logout</button>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-2xl font-bold">Your Feed</h2>
        {posts.length === 0 && <p className="text-gray-400 text-center py-12">No posts yet. Create one!</p>}
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
            <div className="p-4 pb-0 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                {post.username.charAt(0).toUpperCase()}
              </div>
              <Link href={`/profile/${post.user_id}`} className="text-sm font-medium hover:text-primary transition-colors">
                {post.username}
              </Link>
            </div>
            <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover mt-3" />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{post.title}</h3>
              {post.caption && <p className="text-gray-500 text-sm mt-1">{post.caption}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <button onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1 font-medium transition-colors ${post.is_liked ? "text-red-500" : "text-gray-500 hover:text-red-500"}`}>
                  {post.is_liked ? "❤️" : "🤍"} {post.like_count}
                </button>
                <button onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-primary font-medium transition-colors">
                  💬 {post.comment_count}
                </button>
              </div>
              {expandedPosts[post.id] && (
                <div className="mt-4 border-t border-border pt-4 space-y-3">
                  {comments[post.id]?.map(c => (
                    <div key={c.id} className="text-sm">
                      <span className="font-medium">User #{c.user_id}</span>
                      <span className="text-gray-500">: {c.comment}</span>
                    </div>
                  ))}
                  {comments[post.id]?.length === 0 && <p className="text-sm text-gray-400">No comments yet.</p>}
                  <div className="flex gap-2">
                    <input
                      value={commentInputs[post.id] || ""}
                      onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      onKeyDown={e => { if (e.key === "Enter") handleComment(post.id) }}
                    />
                    <button onClick={() => handleComment(post.id)}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors">
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
