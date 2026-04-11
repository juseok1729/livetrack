'use client'

// Basic PPTX → canvas renderer using jszip + XML parsing.
// Handles: background fills (solid + scheme), text shapes, embedded images.

import type { PageText } from './pdf-parser'

export interface PptxRenderResult {
  pages: PageText[]
  images: string[]
  ratios: number[]
}

// ── XML helpers ──────────────────────────────────────────────────────────────

function parseXml(str: string): Document {
  return new DOMParser().parseFromString(str, 'application/xml')
}

function emuToFraction(emu: string | null, total: number): number {
  return emu ? Math.min(1, Math.max(0, parseInt(emu) / total)) : 0
}

// Apply lumMod / lumOff / shade / tint to a hex color
function applyMods(hex: string, mods: Record<string, number>): string {
  let r = parseInt(hex.slice(0, 2), 16)
  let g = parseInt(hex.slice(2, 4), 16)
  let b = parseInt(hex.slice(4, 6), 16)

  if (mods.lumMod !== undefined || mods.lumOff !== undefined) {
    const mod = (mods.lumMod ?? 100000) / 100000
    const off = (mods.lumOff ?? 0) / 100000
    r = Math.round(Math.min(255, r * mod + 255 * off))
    g = Math.round(Math.min(255, g * mod + 255 * off))
    b = Math.round(Math.min(255, b * mod + 255 * off))
  }
  if (mods.shade !== undefined) {
    const s = mods.shade / 100000
    r = Math.round(r * s); g = Math.round(g * s); b = Math.round(b * s)
  }
  if (mods.tint !== undefined) {
    const t = mods.tint / 100000
    r = Math.round(r + (255 - r) * (1 - t))
    g = Math.round(g + (255 - g) * (1 - t))
    b = Math.round(b + (255 - b) * (1 - t))
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Build a scheme → hex map from theme XML
function buildThemeColors(themeXml: string): Record<string, string> {
  const doc = parseXml(themeXml)
  const clrScheme = doc.querySelector('clrScheme')
  if (!clrScheme) return {}
  const map: Record<string, string> = {}
  for (const node of Array.from(clrScheme.children)) {
    const name = node.localName // dk1, lt1, accent1, etc.
    const clr = node.querySelector('srgbClr') ?? node.querySelector('sysClr')
    const val = clr?.getAttribute('val') ?? clr?.getAttribute('lastClr')
    if (val) map[name] = val.slice(0, 6)
  }
  return map
}

// Resolve a color node (srgbClr or schemeClr) to a CSS color string
function resolveColor(node: Element | null, themeColors: Record<string, string>): string | null {
  if (!node) return null

  const srgb = node.querySelector(':scope > srgbClr, srgbClr')
  if (srgb) {
    const val = srgb.getAttribute('val')
    if (!val) return null
    const mods = getMods(srgb)
    return Object.keys(mods).length ? applyMods(val, mods) : `#${val.slice(0, 6)}`
  }

  const scheme = node.querySelector(':scope > schemeClr, schemeClr')
  if (scheme) {
    const name = scheme.getAttribute('val') ?? ''
    const hex = themeColors[name]
    if (!hex) return null
    const mods = getMods(scheme)
    return Object.keys(mods).length ? applyMods(hex, mods) : `#${hex}`
  }

  const sys = node.querySelector('sysClr')
  if (sys) {
    const last = sys.getAttribute('lastClr')
    return last ? `#${last.slice(0, 6)}` : null
  }

  return null
}

function getMods(el: Element): Record<string, number> {
  const mods: Record<string, number> = {}
  for (const mod of Array.from(el.children)) {
    const name = mod.localName
    const val = mod.getAttribute('val')
    if (val && ['lumMod', 'lumOff', 'shade', 'tint', 'alpha'].includes(name)) {
      mods[name] = parseInt(val)
    }
  }
  return mods
}

// Resolve fill from a spPr element (solidFill, then fallback to style fillRef)
function resolveFill(spPr: Element | null, style: Element | null, themeColors: Record<string, string>): string | null {
  // 1. Direct solid fill on shape properties
  if (spPr) {
    const noFill = spPr.querySelector(':scope > noFill')
    if (noFill) return 'transparent'
    const solidFill = spPr.querySelector(':scope > solidFill')
    if (solidFill) return resolveColor(solidFill, themeColors)
  }
  // 2. Style fillRef
  if (style) {
    const fillRef = style.querySelector('fillRef')
    if (fillRef) {
      const idx = parseInt(fillRef.getAttribute('idx') ?? '0')
      if (idx > 0) return resolveColor(fillRef, themeColors)
    }
  }
  return null
}

// ── main renderer ────────────────────────────────────────────────────────────

export async function renderPptxSlides(file: File): Promise<PptxRenderResult> {
  const JSZip = (await import('jszip')).default
  const ab = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(ab)

  // Slide dimensions
  let slideW = 9144000, slideH = 6858000
  const presFile = zip.files['ppt/presentation.xml']
  if (presFile) {
    const doc = parseXml(await presFile.async('string'))
    const sz = doc.querySelector('sldSz')
    if (sz) {
      slideW = parseInt(sz.getAttribute('cx') ?? '9144000')
      slideH = parseInt(sz.getAttribute('cy') ?? '6858000')
    }
  }
  const ratio = slideW / slideH

  // Theme colors
  let themeColors: Record<string, string> = {}
  const themeFile = zip.files['ppt/theme/theme1.xml']
  if (themeFile) themeColors = buildThemeColors(await themeFile.async('string'))

  // Media cache
  const mediaCache: Record<string, string> = {}
  for (const [name, entry] of Object.entries(zip.files)) {
    if (name.startsWith('ppt/media/') && !entry.dir) {
      const ext = name.split('.').pop()?.toLowerCase() ?? 'png'
      const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' }
      const mime = mimeMap[ext] ?? 'image/png'
      mediaCache[name] = `data:${mime};base64,${await entry.async('base64')}`
    }
  }

  // Collect slide files
  const slideNames = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => parseInt(a.match(/\d+/)![0]) - parseInt(b.match(/\d+/)![0]))

  const SCALE = 1.5
  const pages: PageText[] = []
  const images: string[] = []
  const ratios: number[] = []

  for (let i = 0; i < slideNames.length; i++) {
    const slideName = slideNames[i]
    const xml = await zip.files[slideName].async('string')
    const doc = parseXml(xml)

    // Relationship map: rId → data URL
    const relPath = slideName.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels'
    const relMap: Record<string, string> = {}
    if (zip.files[relPath]) {
      const relDoc = parseXml(await zip.files[relPath].async('string'))
      for (const rel of Array.from(relDoc.querySelectorAll('Relationship'))) {
        const target = rel.getAttribute('Target') ?? ''
        const id = rel.getAttribute('Id') ?? ''
        const key = 'ppt/media/' + target.replace('../media/', '').replace(/^.*\//, '')
        const found = Object.keys(mediaCache).find(k => k.endsWith('/' + key.split('/').pop()!))
        if (found) relMap[id] = mediaCache[found]
      }
    }

    const cw = Math.round((slideW / 914400) * 96 * SCALE)
    const ch = Math.round((slideH / 914400) * 96 * SCALE)
    const canvas = document.createElement('canvas')
    canvas.width = cw; canvas.height = ch
    const ctx = canvas.getContext('2d')!

    // Slide background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, cw, ch)

    // Background from <p:bg>
    const bgSolid = doc.querySelector('bg bgPr solidFill')
    const bgColor = bgSolid ? resolveColor(bgSolid, themeColors) : null
    if (bgColor && bgColor !== 'transparent') { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, cw, ch) }

    const textParts: string[] = []
    const spTree = doc.querySelector('spTree')
    if (!spTree) { pages.push({ pageNumber: i + 1, text: '' }); images.push(canvas.toDataURL('image/jpeg', 0.8)); ratios.push(ratio); continue }

    // Draw all elements in DOM order (pictures and shapes together)
    for (const child of Array.from(spTree.children)) {
      const tag = child.localName

      // ── Picture ──────────────────────────────────────────────────────────
      if (tag === 'pic') {
        const blip = child.querySelector('blip')
        const rId = blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')
          ?? blip?.getAttribute('r:embed') ?? ''
        const dataUrl = relMap[rId]
        const xfrm = child.querySelector('spPr xfrm') ?? child.querySelector('xfrm')
        if (!dataUrl || !xfrm) continue
        const x = emuToFraction(xfrm.querySelector('off')?.getAttribute('x') ?? null, slideW) * cw
        const y = emuToFraction(xfrm.querySelector('off')?.getAttribute('y') ?? null, slideH) * ch
        const w = emuToFraction(xfrm.querySelector('ext')?.getAttribute('cx') ?? null, slideW) * cw
        const h = emuToFraction(xfrm.querySelector('ext')?.getAttribute('cy') ?? null, slideH) * ch
        await new Promise<void>(resolve => {
          const img = new Image()
          img.onload = () => { ctx.drawImage(img, x, y, w, h); resolve() }
          img.onerror = () => resolve()
          img.src = dataUrl
        })
        continue
      }

      // ── Shape ─────────────────────────────────────────────────────────────
      if (tag !== 'sp') continue
      const txBody = child.querySelector('txBody')
      const spPr = child.querySelector('spPr')
      const style = child.querySelector('style')

      const xfrm = spPr?.querySelector('xfrm')
      let sx = 0, sy = 0, sw = cw, sh = ch
      if (xfrm) {
        sx = emuToFraction(xfrm.querySelector('off')?.getAttribute('x') ?? null, slideW) * cw
        sy = emuToFraction(xfrm.querySelector('off')?.getAttribute('y') ?? null, slideH) * ch
        sw = emuToFraction(xfrm.querySelector('ext')?.getAttribute('cx') ?? null, slideW) * cw || cw
        sh = emuToFraction(xfrm.querySelector('ext')?.getAttribute('cy') ?? null, slideH) * ch || ch
      }

      // Shape fill
      const fill = resolveFill(spPr ?? null, style ?? null, themeColors)
      if (fill && fill !== 'transparent') {
        ctx.fillStyle = fill
        ctx.fillRect(sx, sy, sw, sh)
      }

      if (!txBody) continue

      // Text rendering
      let lineY = sy + Math.max(4, sh * 0.08)
      const bodyPr = txBody.querySelector('bodyPr')
      const anchor = bodyPr?.getAttribute('anchor') ?? 't'
      if (anchor === 'ctr') lineY = sy + sh * 0.3
      if (anchor === 'b') lineY = sy + sh * 0.7

      const insetL = parseInt(bodyPr?.getAttribute('lIns') ?? '91440') / slideW * cw
      const insetR = parseInt(bodyPr?.getAttribute('rIns') ?? '91440') / slideW * cw
      const textW = sw - insetL - insetR

      for (const para of Array.from(txBody.querySelectorAll('p'))) {
        const runs = Array.from(para.querySelectorAll('r'))
        if (runs.length === 0) { lineY += 12 * SCALE; continue }

        const fullText = runs.map(r => r.querySelector('t')?.textContent ?? '').join('')
        if (!fullText.trim()) { lineY += 8 * SCALE; continue }
        textParts.push(fullText)

        // Font size — check run rPr, then defRPr, then txBody default
        const rPr = runs[0].querySelector('rPr')
        const defRPr = para.querySelector('pPr defRPr') ?? txBody.querySelector('lstStyle defPPr defRPr')
        const szRaw = rPr?.getAttribute('sz') ?? defRPr?.getAttribute('sz') ?? null
        const ptSize = szRaw ? parseInt(szRaw) / 100 : 18
        const px = Math.max(8, Math.min(ptSize * SCALE * 1.2, textW / 3))

        // Text color
        const textColor = resolveColor(rPr?.querySelector('solidFill') ?? null, themeColors)
          ?? resolveColor(defRPr?.querySelector('solidFill') ?? null, themeColors)
          ?? (fill && isLight(fill) ? '#111111' : fill ? '#ffffff' : '#111111')

        const bold = rPr?.getAttribute('b') === '1' || defRPr?.getAttribute('b') === '1'
        ctx.font = `${bold ? 'bold ' : ''}${px}px sans-serif`
        ctx.fillStyle = textColor
        ctx.textBaseline = 'top'

        const algn = para.querySelector('pPr')?.getAttribute('algn') ?? 'l'
        ctx.textAlign = algn === 'ctr' ? 'center' : algn === 'r' ? 'right' : 'left'
        const textX = sx + insetL + (algn === 'ctr' ? textW / 2 : algn === 'r' ? textW : 0)

        // Word-wrap
        const words = fullText.split(' ')
        let line = ''
        for (const word of words) {
          const test = line ? `${line} ${word}` : word
          if (ctx.measureText(test).width > textW && line) {
            ctx.fillText(line, textX, lineY); lineY += px * 1.3; line = word
          } else { line = test }
        }
        if (line) { ctx.fillText(line, textX, lineY); lineY += px * 1.4 }
      }
    }

    pages.push({ pageNumber: i + 1, text: textParts.join(' ').replace(/\s+/g, ' ').trim() })
    images.push(canvas.toDataURL('image/jpeg', 0.8))
    ratios.push(ratio)
  }

  return { pages, images, ratios }
}

// Returns true if hex color is perceptually light
function isLight(hex: string): boolean {
  if (!hex.startsWith('#')) return true
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}
