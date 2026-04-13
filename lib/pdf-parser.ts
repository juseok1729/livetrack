'use client'

import type { TextItem } from 'pdfjs-dist/types/src/display/api'

export interface PageText {
  pageNumber: number
  text: string
}

export interface PdfExtractResult {
  pages: PageText[]
  images: string[]  // JPEG data URLs, one per page (index 0 = page 1)
  ratios: number[]  // width/height aspect ratio per page
}

export async function extractPdfPages(file: File, renderScale = 1.5): Promise<PdfExtractResult> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
  }).promise

  const pages: PageText[] = []
  const images: string[] = []
  const ratios: number[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)

    // Extract text
    const textContent = await page.getTextContent()
    const text = textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map(item => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    pages.push({ pageNumber: i, text })

    // Render page to canvas → JPEG data URL
    const viewport = page.getViewport({ scale: renderScale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, canvas, viewport }).promise
    images.push(canvas.toDataURL('image/jpeg', 0.75))
    ratios.push(viewport.width / viewport.height)
  }

  return { pages, images, ratios }
}
