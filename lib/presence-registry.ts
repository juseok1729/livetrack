// In-memory registry of active lecture participants.
// Lives in the Node.js process — survives across requests in the same process.

const presence = new Map<string, Set<string>>() // lectureId → Set<nickname>

export function registerPresence(lectureId: string, nickname: string) {
  if (!presence.has(lectureId)) presence.set(lectureId, new Set())
  presence.get(lectureId)!.add(nickname)
}

export function unregisterPresence(lectureId: string, nickname: string) {
  presence.get(lectureId)?.delete(nickname)
}

export function getPresence(lectureId: string): string[] {
  return [...(presence.get(lectureId) ?? [])]
}
