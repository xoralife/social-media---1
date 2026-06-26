"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export default function CreatePost() {
  const { token } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ title: "", caption: "" })
  const [imageUrl, setImageUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!token) {
    router.push("/login")
    return null
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    setImageUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      let url = imageUrl
      if (selectedFile) {
        const res = await api.uploadPostImage(selectedFile, token)
        url = res.image_url
      }
      if (!url) { setError("Please select an image or enter a URL"); setLoading(false); return }
      await api.createPost({ title: form.title, caption: form.caption, image_url: url }, token)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <Link href="/dashboard" className="text-sm">Dashboard</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6">Create a Post</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full aspect-square object-cover rounded-lg" />
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-2">Upload from computer</p>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold">
                  Select Image
                </button>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="flex-1 border-t border-border" />
            <span>OR</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <input type="url" placeholder="Paste image URL" value={imageUrl}
            onChange={e => { setImageUrl(e.target.value); if (e.target.value) { setSelectedFile(null); setPreview(e.target.value) }}}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />

          <input type="text" required placeholder="Title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />

          <textarea rows={3} placeholder="Caption (optional)" value={form.caption}
            onChange={e => setForm({ ...form, caption: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400 resize-none" />

          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
            {loading ? "Creating..." : "Create Post"}
          </button>
        </form>
      </main>
    </div>
  )
}
