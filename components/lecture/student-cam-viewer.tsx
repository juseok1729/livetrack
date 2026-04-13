'use client'

import { useEffect, useRef, useState } from 'react'
import { WHEPClient } from '@/lib/whep-client'
import { camStreamPath } from './student-cam-publisher'

interface Props {
  lectureId: string
  nickname: string
  mediamtxUrl: string
}

export function StudentCamViewer({ lectureId, nickname, mediamtxUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const clientRef = useRef<WHEPClient | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const streamPath = camStreamPath(lectureId, nickname)
    const endpoint = `${mediamtxUrl}/${streamPath}/whep`

    async function connect() {
      for (let attempt = 0; attempt < 6; attempt++) {
        if (cancelled) return
        await new Promise(r => setTimeout(r, attempt === 0 ? 800 : 2500))
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
          return
        } catch {
          client.stop()
        }
      }
      if (!cancelled) setError('연결 실패')
    }

    connect()
    return () => {
      cancelled = true
      clientRef.current?.stop()
      clientRef.current = null
    }
  }, [lectureId, nickname, mediamtxUrl])

  return (
    <div className="w-full aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden">
      {error ? (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-white/40 text-xs">{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover scale-x-[-1]"
        />
      )}
    </div>
  )
}
