'use client'

import { useEffect, useRef } from 'react'
import { WHIPClient } from '@/lib/whip-client'

interface Props {
  lectureId: string
  nickname: string
  stream: MediaStream
  mediamtxUrl: string
}

export function camStreamPath(lectureId: string, nickname: string) {
  return `cam-${lectureId}-${nickname.replace(/[^a-zA-Z0-9]/g, '_')}`
}

export function StudentCamPublisher({ lectureId, nickname, stream, mediamtxUrl }: Props) {
  const clientRef = useRef<WHIPClient | null>(null)

  useEffect(() => {
    const streamPath = camStreamPath(lectureId, nickname)
    const endpoint = `${mediamtxUrl}/${streamPath}/whip`
    let mounted = true

    async function publish() {
      const client = new WHIPClient()
      try {
        await client.start(stream, endpoint)
        if (!mounted) { client.stop(); return }
        clientRef.current = client
        await fetch(`/api/lectures/${lectureId}/cameras`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, streamPath }),
        })
      } catch (e) {
        console.warn('Student camera publish failed:', e)
      }
    }

    publish()

    return () => {
      mounted = false
      clientRef.current?.stop()
      clientRef.current = null
      fetch(`/api/lectures/${lectureId}/cameras`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      }).catch(() => {})
    }
  }, [lectureId, nickname, stream, mediamtxUrl])

  return null
}
