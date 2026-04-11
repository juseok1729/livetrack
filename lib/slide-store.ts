// Module-level cache: lectureId → array of JPEG data URLs (one per slide)
// Lives in memory for the duration of the browser session.
const store = new Map<string, string[]>()
const ratioStore = new Map<string, number[]>() // width/height per page

export function setSlides(lectureId: string, slides: string[], ratios: number[]): void {
  store.set(lectureId, slides)
  ratioStore.set(lectureId, ratios)
}

export function getSlides(lectureId: string): string[] | undefined {
  return store.get(lectureId)
}

export function getSlideRatio(lectureId: string, slideIndex: number): number {
  const ratios = ratioStore.get(lectureId)
  return ratios?.[slideIndex] ?? 16 / 9 // default 16:9
}
