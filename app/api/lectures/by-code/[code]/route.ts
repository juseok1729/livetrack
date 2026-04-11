import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { dbChaptersToType, dbLectureToType, type LectureRow } from '@/lib/lecture-helpers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const row = db.prepare('SELECT * FROM lectures WHERE join_code = ? COLLATE NOCASE').get(code) as LectureRow | undefined
  if (!row) return NextResponse.json(null)
  const lecture = dbLectureToType(row, dbChaptersToType(row.id))
  return NextResponse.json({ ...lecture, currentSlideImage: row.current_slide_image })
}
