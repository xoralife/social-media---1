"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { api, getImageUrl } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
import Navbar from "@/components/Navbar"

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
  content?: string
  media_type?: string
  media_url?: string
  created_at: string
  is_read: boolean
}

function formatTime(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ""
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  if (sameDay) return time
  if (isYesterday) return `Yesterday ${time}`
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`
}

export default function ChatContent() {
  const { token } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedUser, setSelectedUser] = useState<{ id: number; username: string } | null>(null)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const selectedUserRef = useRef<{ id: number; username: string } | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  const loadConversations = useCallback(() => {
    if (!token) return
    api.getConversations(token).then(setConversations).catch(() => {})
  }, [token])

  const loadMessages = useCallback(async (userId: number) => {
    if (!token) return
    try {
      const msgs = await api.getMessages(userId, token)
      setMessages(msgs)
    } catch {}
  }, [token])

  useEffect(() => {
    if (!token) return router.push("/login")
    loadConversations()
    const userId = searchParams.get("user")
    if (userId) {
      const uid = Number(userId)
      if (uid) {
        api.getUserProfile(uid, token).then(p => {
          setSelectedUser({ id: p.id, username: p.username })
          loadMessages(p.id)
        }).catch(() => {})
      }
    }
  }, [token, router, searchParams, loadConversations, loadMessages])

  // Poll for new messages + refresh conversations every 5s
  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      loadConversations()
      if (selectedUserRef.current) {
        loadMessages(selectedUserRef.current.id)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [token, loadConversations, loadMessages])

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (openMenuId === null) return
    const close = () => setOpenMenuId(null)
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [openMenuId])

  const selectConversation = async (userId: number, username: string) => {
    setSelectedUser({ id: userId, username })
    await loadMessages(userId)
    loadConversations()
  }

  const handleSend = async () => {
    if (!token || !selectedUser || !input.trim() || sending) return
    const content = input.trim()
    setInput("")
    setSending(true)
    // Optimistic: append a temporary message immediately
    const tempId = Date.now()
    const optimistic: Message = {
      id: tempId,
      sender_id: 0,
      receiver_id: selectedUser.id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, optimistic])
    try {
      const sent = await api.sendMessage({ receiver_id: selectedUser.id, content }, token)
      setMessages(prev => prev.map(m => m.id === tempId ? sent : m))
      loadConversations()
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (messageId: number) => {
    if (!token) return
    try {
      await api.deleteMessage(messageId, token)
      setMessages(prev => prev.filter(m => m.id !== messageId))
      loadConversations()
    } catch (err) {
      console.error("Failed to delete message:", err)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : ""
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []
      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.start()
      setRecording(true)
      setRecordSecs(0)
      recordTimerRef.current = setInterval(() => {
        setRecordSecs(s => s + 1)
      }, 1000)
    } catch (err) {
      console.error("Microphone access denied:", err)
      alert("Could not access microphone. Please grant permission.")
    }
  }

  const stopAndSendRecording = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder || !token || !selectedUser) {
      cancelRecording()
      return
    }
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    setRecording(false)
    recorder.onstop = async () => {
      const recordedType = recorder.mimeType || "audio/webm"
      const blob = new Blob(audioChunksRef.current, { type: recordedType })
      streamCleanup()
      if (blob.size === 0) return
      setSending(true)
      const tempId = Date.now()
      const optimistic: Message = {
        id: tempId,
        sender_id: 0,
        receiver_id: selectedUser.id,
        media_type: "voice",
        media_url: "",
        created_at: new Date().toISOString(),
        is_read: false,
      }
      setMessages(prev => [...prev, optimistic])
      try {
        const { media_url } = await api.uploadVoice(blob, token)
        const sent = await api.sendMessage(
          { receiver_id: selectedUser.id, media_type: "voice", media_url },
          token,
        )
        setMessages(prev => prev.map(m => m.id === tempId ? sent : m))
        loadConversations()
      } catch {
        setMessages(prev => prev.filter(m => m.id !== tempId))
      } finally {
        setSending(false)
      }
    }
    recorder.stop()
  }

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current)
      recordTimerRef.current = null
    }
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => streamCleanup()
      recorder.stop()
    } else {
      streamCleanup()
    }
    setRecording(false)
    setRecordSecs(0)
  }

  const streamCleanup = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.stream) {
      recorder.stream.getTracks().forEach(t => t.stop())
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/profile">Profile</Link>
      </Navbar>

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
              <div className="text-gray-400 text-[10px] pl-9">{formatTime(c.last_message_time)}</div>
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
                {messages.map(m => {
                  const mine = m.sender_id !== selectedUser.id
                  return (
                    <div key={m.id} className={`flex group ${mine ? "justify-end" : ""}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-lg text-sm relative ${
                        mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}>
                        {m.media_type === "voice" ? (
                          m.media_url ? (
                            <audio controls src={getImageUrl(m.media_url)} className="w-full max-w-[200px] h-8" />
                          ) : (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="animate-pulse">🎤</span> Sending...
                            </div>
                          )
                        ) : (
                          <div>{m.content}</div>
                        )}
                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? "text-white/80" : "text-gray-500"}`}>
                          {formatTime(m.created_at)}
                          {mine && (
                            <span className={m.is_read ? "text-sky-300" : "text-white/80"}>
                              {m.is_read ? "✓✓" : "✓"}
                            </span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === m.id ? null : m.id) }}
                            className={`ml-1 px-1 leading-none ${mine ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-gray-600"}`}
                            title="More"
                          >
                            ⋮
                          </button>
                        </div>
                        {openMenuId === m.id && (
                          <div className={`absolute z-10 ${mine ? "right-0" : "left-0"} bottom-0 translate-y-full rounded-lg shadow-lg border border-border overflow-hidden`}>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(m.id); setOpenMenuId(null) }}
                              className="block w-full px-4 py-2 text-xs text-left bg-white text-red-600 hover:bg-red-50 whitespace-nowrap"
                            >
                              Delete message
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEnd} />
              </div>
              <div className="p-3 border-t border-border flex gap-2 items-center">
                {recording ? (
                  <>
                    <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      {recordSecs}s
                    </span>
                    <button onClick={cancelRecording}
                      className="px-3 py-2 border border-border rounded-lg text-sm font-semibold text-gray-600">Cancel</button>
                    <button onClick={stopAndSendRecording} disabled={sending}
                      className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">Send Voice</button>
                  </>
                ) : (
                  <>
                    <input value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSend() }}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm outline-none focus:border-gray-400" />
                    <button onClick={startRecording} disabled={sending}
                      title="Record voice message"
                      className="px-3 py-2 border border-border rounded-lg text-sm disabled:opacity-50">🎤</button>
                    <button onClick={handleSend} disabled={sending || !input.trim()}
                      className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold disabled:opacity-50">Send</button>
                  </>
                )}
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
