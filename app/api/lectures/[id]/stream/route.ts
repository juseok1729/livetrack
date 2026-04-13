import { NextRequest } from 'next/server'
import { sseSubscribe, sseUnsubscribe } from '@/lib/sse-bus'

const encoder = new TextEncoder()

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let ctrl: ReadableStreamDefaultController<Uint8Array>

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      ctrl = c
      sseSubscribe(id, c)
      // Confirm connection
      c.enqueue(encoder.encode(': connected\n\n'))

      // Heartbeat every 25s to survive proxy timeouts (Caddy default is 30s)
      const hb = setInterval(() => {
        try {
          c.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(hb)
          sseUnsubscribe(id, c)
        }
      }, 25_000)

      req.signal.addEventListener('abort', () => {
        clearInterval(hb)
        sseUnsubscribe(id, ctrl)
        try { c.close() } catch { /* already closed */ }
      })
    },
    cancel() {
      sseUnsubscribe(id, ctrl)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx/Caddy buffering
    },
  })
}
