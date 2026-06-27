"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import ThemeToggle from "@/components/ThemeToggle"

type Post = {
  id: number
  user_id: number
  title: string
  caption?: string
  image_url: string
  username: string
  profile_pic?: string | null
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

export default function PostDetail() {
  const { token } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [error, setError] = useState("")
  const [myId, setMyId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return router.push("/login")
    const pid = Number(params.id)
    if (!pid) { setError("Invalid post"); return }
    api.getPost(pid, token).then(setPost).catch(() => setError("Post not found"))
    api.getComments(pid, token).then(setComments).catch(() => {})
    api.getProfile(token).then(p => setMyId(p.id)).catch(() => {})
  }, [token, router, params.id])

  const handleLike = async () => {
    if (!token || !post) return
    try {
      await api.likePost(post.id, token)
      setPost(prev => prev ? { ...prev, is_liked: true, like_count: prev.like_count + 1 } : prev)
    } catch {}
  }

  const handleComment = async () => {
    if (!token || !post || !commentInput.trim()) return
    try {
      await api.comment({ post_id: post.id, comment: commentInput }, token)
      setCommentInput("")
      const data = await api.getComments(post.id, token)
      setComments(data)
      setPost(prev => prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev)
    } catch {}
  }

  const handleDelete = async () => {
    if (!token || !post) return
    try {
      await api.deletePost(post.id, token)
      router.push("/")
    } catch {}
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <p className="text-gray-500">{error}</p>
    </div>
  )

  if (!post) return null

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <div className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <Link href="/">Back</Link>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border">
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
            {myId === post.user_id && (
              <button onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-700 font-semibold">
                Delete
              </button>
            )}
          </div>
          <img src={getImageUrl(post.image_url)} alt={post.title} className="w-full aspect-square object-cover" />
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-4">
              <button onClick={handleLike} className="text-lg">{post.is_liked ? "❤️" : "🤍"}</button>
              <span className="text-lg">💬</span>
            </div>
            <p className="text-sm font-semibold">{post.like_count} likes</p>
            <p className="text-sm">
              <Link href={`/profile/${post.user_id}`} className="font-semibold mr-1">{post.username}</Link>
              {post.caption || post.title}
            </p>
            <div className="pt-2 border-t border-border space-y-2">
              {comments.map(c => (
                <p key={c.id} className="text-sm">
                  <span className="font-semibold">User #{c.user_id}</span> {c.comment}
                </p>
              ))}
              <div className="flex gap-2 pt-1">
                <input value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 text-sm outline-none"
                  onKeyDown={e => { if (e.key === "Enter") handleComment() }} />
                <button onClick={handleComment}
                  className="text-sm font-semibold text-accent hover:text-blue-600">Post</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
