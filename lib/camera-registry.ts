// In-memory registry of active student camera streams.
// Lives in the Node.js process — survives across requests in the same process.

interface CameraEntry {
  nickname: string
  streamPath: string
}

const cameras = new Map<string, Map<string, CameraEntry>>() // lectureId → Map<nickname, entry>

export function registerCamera(lectureId: string, nickname: string, streamPath: string) {
  if (!cameras.has(lectureId)) cameras.set(lectureId, new Map())
  cameras.get(lectureId)!.set(nickname, { nickname, streamPath })
}

export function unregisterCamera(lectureId: string, nickname: string) {
  cameras.get(lectureId)?.delete(nickname)
}

export function getActiveCameras(lectureId: string): CameraEntry[] {
  return [...(cameras.get(lectureId)?.values() ?? [])]
}
