// Module-level memory cache (fast path)
const store = new Map<string, string[]>()
const ratioStore = new Map<string, number[]>()

// IndexedDB persistence (survives page reload)
const IDB_NAME = 'livetrack-slides'
const IDB_VERSION = 1
const IDB_STORE = 'slides'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function setSlides(lectureId: string, slides: string[], ratios: number[]): void {
  store.set(lectureId, slides)
  ratioStore.set(lectureId, ratios)
  // Persist asynchronously to survive page reloads
  if (typeof window !== 'undefined' && window.indexedDB) {
    openDb()
      .then(db => {
        const tx = db.transaction(IDB_STORE, 'readwrite')
        tx.objectStore(IDB_STORE).put({ slides, ratios }, lectureId)
      })
      .catch(() => { /* ignore quota / private-mode errors */ })
  }
}

export function getSlides(lectureId: string): string[] | undefined {
  return store.get(lectureId)
}

export function getSlideRatio(lectureId: string, slideIndex: number): number {
  const ratios = ratioStore.get(lectureId)
  return ratios?.[slideIndex] ?? 16 / 9
}

/** Restore from IndexedDB if not in memory. Returns true if slides are now available. */
export async function restoreSlides(lectureId: string): Promise<boolean> {
  if (store.has(lectureId)) return true
  if (typeof window === 'undefined' || !window.indexedDB) return false
  try {
    const db = await openDb()
    return new Promise(resolve => {
      const req = db
        .transaction(IDB_STORE, 'readonly')
        .objectStore(IDB_STORE)
        .get(lectureId)
      req.onsuccess = () => {
        const data = req.result as { slides: string[]; ratios: number[] } | undefined
        if (data?.slides?.length) {
          store.set(lectureId, data.slides)
          ratioStore.set(lectureId, data.ratios)
          resolve(true)
        } else {
          resolve(false)
        }
      }
      req.onerror = () => resolve(false)
    })
  } catch {
    return false
  }
}
