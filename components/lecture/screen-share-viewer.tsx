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
      setError('')
      return
    }

    let cancelled = false
    setError('')

    async function connect() {
      const endpoint = `${mediamtxUrl}/${lectureId}/whep`
      const MAX_ATTEMPTS = 12
      const RETRY_DELAY = 2500

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (cancelled) return
        // First attempt: short delay; subsequent: longer
        await new Promise(r => setTimeout(r, attempt === 0 ? 1200 : RETRY_DELAY))
        if (cancelled) return

        const client = new WHEPClient()
        try {
          const stream = await client.start(endpoint)
          if (cancelled) { client.stop(); return }
          clientRef.current = client
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(() => {})
          }
          return // success
        } catch (e) {
          client.stop()
          const msg = e instanceof Error ? e.message : '연결 실패'
          // Track timeout = ICE failure → no point retrying
          if (msg.includes('timeout') || msg.includes('Timeout')) {
            if (!cancelled) setError('ICE 연결 실패 (방화벽/포트 차단)')
            return
          }
          // HTTP error → keep retrying (stream may not be ready yet)
          if (attempt === MAX_ATTEMPTS - 1 && !cancelled) {
            setError(`화면공유 연결 실패 (${msg})`)
          }
        }
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
