"use client"

import { useRef, useEffect } from "react"
import { getImageUrl } from "@/lib/api"

export function AutoPlayVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            el.play().catch(() => {})
          } else {
            el.pause()
          }
        })
      },
      { threshold: [0, 0.6, 1] }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      src={getImageUrl(src)}
      className={className}
      muted
      loop
      playsInline
      autoPlay
    />
  )
}

export function PostMedia({
  src,
  alt,
  mediaType,
  className,
}: {
  src: string
  alt?: string
  mediaType?: string
  className?: string
}) {
  if (mediaType === "video") {
    return <AutoPlayVideo src={src} className={className} />
  }
  return (
    <img
      src={getImageUrl(src)}
      alt={alt ?? ""}
      className={className}
    />
  )
}
