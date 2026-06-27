"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

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

export default function Dashboard() {
  const { token, logout } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [myId, setMyId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Post[] | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!token) return router.push("/login")
    api.getPosts(token).then(setPosts).catch(() => setPosts([]))
    api.getProfile(token).then(p => setMyId(p.id)).catch(() => {})
  }, [token, router])

  const handleSearch = async () => {
    if (!token || !searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    try {
      const results = await api.searchPosts(searchQuery, token)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleDelete = async (postId: number) => {
    if (!token) return
    try {
      await api.deletePost(postId, token)
      setPosts(prev => prev.filter(p => p.id !== postId))
      if (searchResults) setSearchResults(prev => prev ? prev.filter(p => p.id !== postId) : prev)
    } catch {}
  }

  const displayPosts = searchResults !== null ? searchResults : posts

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/create-post">Create</Link>
            <Link href="/profile">Profile</Link>
            <Link href="/chat">Chat</Link>
            <button onClick={() => { logout(); router.push("/") }} className="text-red-500">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch() }}
            placeholder="Search posts..."
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400"
          />
          <button onClick={handleSearch}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            disabled={searching}>
            {searching ? "..." : "Search"}
          </button>
          {searchResults !== null && (
            <button onClick={() => { setSearchResults(null); setSearchQuery("") }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 space-y-4 pb-8">
        {searchResults !== null && searchResults.length === 0 && (
          <p className="text-gray-400 text-center py-8 text-sm">No posts found.</p>
        )}
        {displayPosts.map(post => (
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
              {myId === post.user_id && (
                <button onClick={() => handleDelete(post.id)}
                  className="text-sm text-red-500 hover:text-red-700 font-semibold">
                  Delete
                </button>
              )}
            </div>
            <Link href={`/post/${post.id}`}>
              <img src={getImageUrl(post.image_url)} alt={post.title} className="w-full aspect-square object-cover" />
            </Link>
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-4">
                <button onClick={() => {
                  if (!token) return
                  api.likePost(post.id, token).then(() => {
                    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, is_liked: true, like_count: p.like_count + 1 } : p))
                  }).catch(() => {})
                }} className="text-lg">
                  {post.is_liked ? "❤️" : "🤍"}
                </button>
                <Link href={`/post/${post.id}`} className="text-lg">💬</Link>
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
