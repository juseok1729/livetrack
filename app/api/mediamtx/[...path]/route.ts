/**
 * Next.js → MediaMTX proxy for WHIP/WHEP signaling.
 * Avoids the need for a separate Caddy route.
 * Only the HTTP signaling (SDP offer/answer) goes through here;
 * actual WebRTC media flows directly over UDP 8189.
 */
import { NextRequest } from 'next/server'

const MEDIAMTX_INTERNAL = process.env.MEDIAMTX_INTERNAL_URL ?? 'http://mediamtx:8889'

async function proxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const target = `${MEDIAMTX_INTERNAL}/${path.join('/')}`
  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined

  const res = await fetch(target, {
    method: req.method,
    headers: {
      'Content-Type': req.headers.get('Content-Type') ?? 'application/sdp',
      'Accept': req.headers.get('Accept') ?? 'application/sdp',
    },
    body,
  })

  const text = await res.text()
  if (!res.ok) {
    console.error(`[mediamtx proxy] ${req.method} ${target} → ${res.status}: ${text}`)
  }
  return new Response(text, {
    status: res.status,
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'application/sdp',
      'Access-Control-Allow-Origin': '*',
      'Location': res.headers.get('Location') ?? '',
    },
  })
}

export const GET = proxy
export const POST = proxy
export const DELETE = proxy
export const OPTIONS = async () => new Response(null, {
  headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS' }
})
