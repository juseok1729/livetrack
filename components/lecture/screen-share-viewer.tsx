'use client'

import { useEffect, useRef, useState } from 'react'
import { WHEPClient } from '@/lib/whep-client'

interface Props {
  lectureId: string
  mediamtxUrl: string
  active: boolean
}

export function ScreenShareViewer({ lectureId, mediamtxUrl, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const clientRef = useRef<WHEPClient | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active) {
      clientRef.current?.stop()
      clientRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      return
    }

    let cancelled = false
    setError('')

    async function connect() {
      // Short delay to let MediaMTX register the stream
      await new Promise(r => setTimeout(r, 800))
      if (cancelled) return

      try {
        const client = new WHEPClient()
        const endpoint = `${mediamtxUrl}/${lectureId}/whep`
        const stream = await client.start(endpoint)
        if (cancelled) { client.stop(); return }
        clientRef.current = client
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '연결 실패')
      }
    }

    connect()
    return () => {
      cancelled = true
      clientRef.current?.stop()
      clientRef.current = null
    }
  }, [active, lectureId, mediamtxUrl])

  if (!active) return null

  return (
    <div className="absolute inset-0 bg-black z-10 flex items-center justify-center">
      {error ? (
        <p className="text-white/60 text-sm">{error}</p>
      ) : (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          className="w-full h-full object-contain"
        />
      )}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        화면공유 중
      </div>
    </div>
  )
}
