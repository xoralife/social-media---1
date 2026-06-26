"use client"

import { Suspense } from "react"
import ChatContent from "./ChatContent"

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading...</div>}>
      <ChatContent />
    </Suspense>
  )
}
