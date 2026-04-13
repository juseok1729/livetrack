import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'

interface SlideRow { slide_index: number; image: string; ratio: number }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = getDb()
    .prepare('SELECT slide_index, image, ratio FROM lecture_slides WHERE lecture_id = ? ORDER BY slide_index')
    .all(id) as SlideRow[]
  return NextResponse.json({
    images: rows.map(r => r.image),
    ratios: rows.map(r => r.ratio),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { images, ratios } = await req.json() as { images: string[]; ratios: number[] }
  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json({ error: 'images required' }, { status: 400 })
  }
  const db = getDb()
  const insert = db.prepare(
    'INSERT OR REPLACE INTO lecture_slides (lecture_id, slide_index, image, ratio) VALUES (?, ?, ?, ?)'
  )
  const deleteOld = db.prepare('DELETE FROM lecture_slides WHERE lecture_id = ?')
  db.transaction(() => {
    deleteOld.run(id)
    images.forEach((img, i) => insert.run(id, i, img, ratios[i] ?? 16 / 9))
  })()
  return NextResponse.json({ ok: true })
}
