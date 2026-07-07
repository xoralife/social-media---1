"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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

type Comment = {
  id: number
  user_id: number
  post_id: number
  comment: string
  parent_id?: number | null
  username?: string | null
  profile_pic?: string | null
}

export default function PostDetail() {
  const { token, user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentInput, setCommentInput] = useState("")
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return router.push("/login")
    const pid = Number(params.id)
    if (!pid) { setError("Invalid post"); return }
    api.getPost(pid, token).then(setPost).catch(() => setError("Post not found"))
    api.getComments(pid, token).then(setComments).catch(() => {})
  }, [token, router, params.id])

  const handleLike = async () => {
    if (!token || !post) return
    if (post.user_id === user?.id) return
    try {
      if (post.is_liked) {
        await api.unlikePost(post.id, token)
        setPost(prev => prev ? { ...prev, is_liked: false, like_count: prev.like_count - 1 } : prev)
      } else {
        await api.likePost(post.id, token)
        setPost(prev => prev ? { ...prev, is_liked: true, like_count: prev.like_count + 1 } : prev)
      }
    } catch {}
  }

  const handleFavorite = async () => {
    if (!token || !post) return
    try {
      if (post.is_favorited) {
        await api.unfavoritePost(post.id, token)
        setPost(prev => prev ? { ...prev, is_favorited: false } : prev)
      } else {
        await api.favoritePost(post.id, token)
        setPost(prev => prev ? { ...prev, is_favorited: true } : prev)
      }
    } catch {}
  }

  const handleComment = async () => {
    if (!token || !post || !commentInput.trim()) return
    try {
      await api.comment(
        { post_id: post.id, comment: commentInput, parent_id: replyTo?.id },
        token
      )
      setCommentInput("")
      setReplyTo(null)
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

  const topLevel = comments.filter(c => !c.parent_id)
  const repliesOf = (id: number) => comments.filter(c => c.parent_id === id)

  return (
    <div className="min-h-screen bg-surface">
      <Navbar>
        <Link href="/">Back</Link>
      </Navbar>

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
            {user?.id === post.user_id && (
              <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700 font-semibold">Delete</button>
            )}
          </div>
          {post.media_type === "video" ? (
            <video src={getImageUrl(post.image_url)} className="w-full max-h-[600px] object-contain bg-black" controls autoPlay loop muted playsInline />
          ) : (
            <img src={getImageUrl(post.image_url)} alt={post.title} className="w-full max-h-[600px] object-contain bg-gray-50 mx-auto" />
          )}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-4">
              <button onClick={handleLike} className="text-lg">
                {post.is_liked ? "❤️" : "🤍"}
              </button>
              <span className="text-lg">💬</span>
              <button onClick={handleFavorite} className="text-lg ml-auto">
                {post.is_favorited ? "★" : "☆"}
              </button>
            </div>
            <p className="text-sm font-semibold">{post.like_count} likes</p>
            <p className="text-sm">
              <Link href={`/profile/${post.user_id}`} className="font-semibold mr-1">{post.username}</Link>
              {post.caption || post.title}
            </p>
            <div className="pt-2 border-t border-border space-y-3">
              {topLevel.map(c => (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    {c.profile_pic ? (
                      <img src={getImageUrl(c.profile_pic)} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold shrink-0">
                        {(c.username || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold mr-1.5">
                        <Link href={`/profile/${c.user_id}`}>{c.username || `User #${c.user_id}`}</Link>
                      </span>
                      <span className="text-sm">{c.comment}</span>
                      <button
                        onClick={() => setReplyTo(c)}
                        className="text-xs text-gray-400 hover:text-gray-600 ml-2"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                  {repliesOf(c.id).map(r => (
                    <div key={r.id} className="flex items-start gap-2 pl-8">
                      {r.profile_pic ? (
                        <img src={getImageUrl(r.profile_pic)} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold shrink-0">
                          {(r.username || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold mr-1.5">
                          <Link href={`/profile/${r.user_id}`}>{r.username || `User #${r.user_id}`}</Link>
                        </span>
                        <span className="text-sm">{r.comment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {replyTo && (
                <div className="flex items-center gap-2 text-xs text-gray-500 pl-2">
                  <span>Replying to <strong>{replyTo.username || `User #${replyTo.user_id}`}</strong></span>
                  <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <input
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.username || "user"}...` : "Add a comment..."}
                  className="flex-1 text-sm outline-none"
                  onKeyDown={e => { if (e.key === "Enter") handleComment() }}
                  autoFocus
                />
                <button onClick={handleComment} className="text-sm font-semibold text-accent hover:text-blue-600">Post</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
