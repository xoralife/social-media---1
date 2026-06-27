"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import ThemeToggle from "@/components/ThemeToggle"

type Conversation = {
  user_id: number
  username: string
  profile_pic?: string
  last_message: string
  last_message_time: string
  unread_count: number
}

type Message = {
  id: number
  sender_id: number
  receiver_id: number
  content: string
  created_at: string
  is_read: boolean
}

export default function ChatContent() {
  const { token } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedUser, setSelectedUser] = useState<{ id: number; username: string } | null>(null)
  const [input, setInput] = useState("")
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return router.push("/login")
    api.getConversations(token).then(setConversations).catch(() => {})
    const userId = searchParams.get("user")
    if (userId) {
      const uid = Number(userId)
      if (uid) {
        api.getUserProfile(uid, token).then(p => {
          setSelectedUser({ id: p.id, username: p.username })
          api.getMessages(uid, token).then(setMessages).catch(() => {})
        }).catch(() => {})
      }
    }
  }, [token, router, searchParams])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const selectConversation = async (userId: number, username: string) => {
    if (!token) return
    setSelectedUser({ id: userId, username })
    const msgs = await api.getMessages(userId, token)
    setMessages(msgs)
    api.getConversations(token).then(setConversations).catch(() => {})
  }

  const handleSend = async () => {
    if (!token || !selectedUser || !input.trim()) return
    try {
      await api.sendMessage({ receiver_id: selectedUser.id, content: input }, token)
      setInput("")
      const msgs = await api.getMessages(selectedUser.id, token)
      setMessages(msgs)
      api.getConversations(token).then(setConversations).catch(() => {})
    } catch {}
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">SocialApp</Link>
          <nav className="flex items-center gap-3 text-sm">
            <ThemeToggle />
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/profile">Profile</Link>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex max-w-xl mx-auto w-full">
        <div className="w-64 border-r border-border overflow-y-auto">
          <div className="p-3 font-semibold text-sm border-b border-border">Messages</div>
          {conversations.map(c => (
            <button key={c.user_id} onClick={() => selectConversation(c.user_id, c.username)}
              className={`w-full text-left px-3 py-3 text-sm hover:bg-gray-50 transition-colors ${
                selectedUser?.id === c.user_id ? "bg-gray-50" : ""
              }`}>
              <div className="flex items-center gap-2">
                {c.profile_pic ? (
                  <img src={getImageUrl(c.profile_pic)} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold shrink-0">
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="font-semibold">{c.username}</div>
              </div>
              <div className="text-gray-500 text-xs truncate pl-9">{c.last_message}</div>
              {c.unread_count > 0 && (
                <span className="text-xs text-accent font-semibold pl-9">{c.unread_count} unread</span>
              )}
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="text-gray-400 text-xs text-center py-4">No conversations</p>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-3 font-semibold text-sm border-b border-border">{selectedUser.username}</div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === selectedUser.id ? "" : "justify-end"}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      m.sender_id === selectedUser.id
                        ? "bg-gray-100"
                        : "bg-black text-white"
                    }`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEnd} />
              </div>
              <div className="p-3 border-t border-border flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSend() }}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
                <button onClick={handleSend}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold">Send</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
