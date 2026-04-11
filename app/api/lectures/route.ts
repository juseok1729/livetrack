import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { dbChaptersToType, dbLectureToType, type LectureRow } from '@/lib/lecture-helpers'

export async function GET() {
  const user = await getSession()
  if (!user || user.role !== 'lecturer') return NextResponse.json([], { status: 401 })
  const db = getDb()
  const rows = db.prepare('SELECT * FROM lectures WHERE created_by = ? ORDER BY created_at DESC').all(user.id) as LectureRow[]
  const lectures = rows.map(r => dbLectureToType(r, dbChaptersToType(r.id)))
  return NextResponse.json(lectures)
}

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user || user.role !== 'lecturer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, title, code } = await req.json()
  const db = getDb()
  db.prepare('INSERT INTO lectures (id, join_code, title, created_by) VALUES (?,?,?,?)').run(id, code, title ?? '새 강의', user.id)
  const row = db.prepare('SELECT * FROM lectures WHERE id = ?').get(id) as LectureRow
  return NextResponse.json(dbLectureToType(row, []))
}
