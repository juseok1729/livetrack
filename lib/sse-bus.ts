// Module-level in-memory pub/sub for SSE.
// Lives in the Node.js process — survives across requests in the same process.

type Controller = ReadableStreamDefaultController<Uint8Array>

const subscribers = new Map<string, Set<Controller>>()
const encoder = new TextEncoder()

export function getSubscriberCount(lectureId: string): number {
  return subscribers.get(lectureId)?.size ?? 0
}

function publishCount(lectureId: string) {
  ssePublish(lectureId, { studentCount: getSubscriberCount(lectureId) })
}

export function sseSubscribe(lectureId: string, ctrl: Controller) {
  if (!subscribers.has(lectureId)) subscribers.set(lectureId, new Set())
  subscribers.get(lectureId)!.add(ctrl)
  publishCount(lectureId)
}

export function sseUnsubscribe(lectureId: string, ctrl: Controller) {
  subscribers.get(lectureId)?.delete(ctrl)
  publishCount(lectureId)
}

export function ssePublish(lectureId: string, payload: Record<string, unknown>) {
  const subs = subscribers.get(lectureId)
  if (!subs || subs.size === 0) return
  const msg = encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
  for (const ctrl of [...subs]) {
    try {
      ctrl.enqueue(msg)
    } catch {
      subs.delete(ctrl)
    }
  }
}
