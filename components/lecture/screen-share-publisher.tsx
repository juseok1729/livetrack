'use client'

import { useEffect, useRef, useState } from 'react'
import { Monitor, MonitorOff } from 'lucide-react'
import { WHIPClient } from '@/lib/whip-client'

interface Props {
  lectureId: string
  mediamtxUrl: string
  onStateChange: (sharing: boolean) => void
}

export function ScreenSharePublisher({ lectureId, mediamtxUrl, onStateChange }: Props) {
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState('')
  const [connecting, setConnecting] = useState(false)
  const clientRef = useRef<WHIPClient | null>(null)
  const previewRef = useRef<HTMLVideoElement>(null)

  async function startSharing() {
    setError('')
    setConnecting(true)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      })

      // Show local preview
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        previewRef.current.play().catch(() => {})
      }

      // Stop if user closes the browser's share dialog
      stream.getVideoTracks()[0].addEventListener('ended', () => stopSharing())

      const client = new WHIPClient()
      const endpoint = `${mediamtxUrl}/${lectureId}/whip`
      await client.start(stream, endpoint)

      clientRef.current = client
      setSharing(true)
      onStateChange(true)

      // Notify server → SSE broadcast to students
      await fetch(`/api/lectures/${lectureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenSharing: true }),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '화면공유 시작 실패')
    } finally {
      setConnecting(false)
    }
  }

  async function stopSharing() {
    clientRef.current?.stop()
    clientRef.current = null
    if (previewRef.current) previewRef.current.srcObject = null
    setSharing(false)
    onStateChange(false)
    await fetch(`/api/lectures/${lectureId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ screenSharing: false }),
    }).catch(() => {})
  }

  // Clean up on unmount
  useEffect(() => () => { clientRef.current?.stop() }, [])

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={sharing ? stopSharing : startSharing}
        disabled={connecting}
        title={sharing ? '화면공유 중지' : '화면공유 시작'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50
          ${sharing
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'border border-[#e5e5e5] text-[#555555] hover:border-[#865FDF] hover:text-[#865FDF]'
          }`}
      >
        {sharing ? <MonitorOff size={15} /> : <Monitor size={15} />}
        {connecting ? '연결 중...' : sharing ? '공유 중지' : '화면공유'}
      </button>
      {/* Hidden local preview (keeps stream alive) */}
      <video ref={previewRef} muted playsInline className="hidden" />
    </div>
  )
}
