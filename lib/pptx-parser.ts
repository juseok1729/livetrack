'use client'

import type { PageText } from './pdf-parser'

// Extract text from each slide in a PPTX file using JSZip.
// PPTX is a ZIP archive; slides live at ppt/slides/slide{n}.xml.
// Text nodes are <a:t> elements inside the slide XML.
export async function extractPptxPages(file: File): Promise<PageText[]> {
  const JSZip = (await import('jszip')).default
  const arrayBuffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Collect slide files in order (slide1.xml, slide2.xml, ...)
  const slideEntries = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] ?? '0')
      const numB = parseInt(b.match(/\d+/)?.[0] ?? '0')
      return numA - numB
    })

  const pages: PageText[] = []

  for (let i = 0; i < slideEntries.length; i++) {
    const xml = await zip.files[slideEntries[i]].async('string')
    // Extract all <a:t>...</a:t> text nodes
    const matches = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)]
    const text = matches
      .map(m => m[1].trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    pages.push({ pageNumber: i + 1, text })
  }

  return pages
}
