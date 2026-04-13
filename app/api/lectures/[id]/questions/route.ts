import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { dbQuestionsToType } from '@/lib/lecture-helpers'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json(dbQuestionsToType(id))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const q = await req.json()
  const db = getDb()
  db.prepare(
    'INSERT INTO questions (id, lecture_id, chapter_id, student_name, content, created_at) VALUES (?,?,?,?,?,?)'
  ).run(q.id, id, q.chapterId ?? '', q.studentName, q.content, q.createdAt ?? new Date().toISOString())
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()
  if (!user || user.role !== 'lecturer') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  getDb().prepare('DELETE FROM questions WHERE lecture_id = ?').run(id)
  return NextResponse.json({ ok: true })
}
