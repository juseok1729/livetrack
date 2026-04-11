import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import type { Chapter } from '@/lib/types'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()
  if (!user || user.role !== 'lecturer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { chapters }: { chapters: Chapter[] } = await req.json()
  const db = getDb()
  const deleteChapters = db.prepare('DELETE FROM chapters WHERE lecture_id = ?')
  const insertChapter = db.prepare(
    'INSERT INTO chapters (id, lecture_id, title, slide_start, slide_end, summary, status, order_idx) VALUES (?,?,?,?,?,?,?,?)'
  )
  const tx = db.transaction(() => {
    deleteChapters.run(id)
    for (const c of chapters) {
      insertChapter.run(c.id, id, c.title, c.slideRange[0], c.slideRange[1], c.summary ?? null, c.status, c.order)
    }
  })
  tx()
  return NextResponse.json({ ok: true })
}
