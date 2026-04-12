import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import { dbChaptersToType, dbLectureToType, type LectureRow } from '@/lib/lecture-helpers'
import { ssePublish } from '@/lib/sse-bus'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const row = db.prepare('SELECT * FROM lectures WHERE id = ?').get(id) as LectureRow | undefined
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(dbLectureToType(row, dbChaptersToType(id)))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = getDb()
  const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(id) as LectureRow | undefined
  if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()

  const fields: string[] = []
  const values: unknown[] = []

  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title) }
  if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status) }
  if (body.totalSlides !== undefined) { fields.push('total_slides = ?'); values.push(body.totalSlides) }
  if (body.currentSlide !== undefined) { fields.push('current_slide = ?'); values.push(body.currentSlide) }
  if (body.currentChapterId !== undefined) { fields.push('current_chapter_id = ?'); values.push(body.currentChapterId) }
  if (body.currentSlideImage !== undefined) { fields.push('current_slide_image = ?'); values.push(body.currentSlideImage) }
  if (body.startedAt !== undefined) { fields.push('started_at = ?'); values.push(body.startedAt) }
  if (body.currentStrokes !== undefined) { fields.push('current_strokes = ?'); values.push(body.currentStrokes) }
  if (body.status === 'ended') { fields.push('ended_at = ?'); values.push(new Date().toISOString()) }
  if (body.peakStudents !== undefined) { fields.push('peak_students = ?'); values.push(body.peakStudents) }
  if (body.screenSharing !== undefined) { fields.push('screen_sharing = ?'); values.push(body.screenSharing ? 1 : 0) }

  if (fields.length === 0) return NextResponse.json({ error: 'No fields' }, { status: 400 })
  values.push(id)
  db.prepare(`UPDATE lectures SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  const updated = db.prepare('SELECT * FROM lectures WHERE id = ?').get(id) as LectureRow

  // Push to SSE subscribers (students watching this lecture)
  const event: Record<string, unknown> = {}
  if (body.currentSlide !== undefined) event.currentSlide = body.currentSlide
  if (body.currentChapterId !== undefined) event.currentChapterId = body.currentChapterId
  if (body.currentSlideImage !== undefined) event.currentSlideImage = body.currentSlideImage
  if (body.currentStrokes !== undefined) event.currentStrokes = body.currentStrokes
  if (body.status !== undefined) event.status = body.status
  if (body.screenSharing !== undefined) event.screenSharing = body.screenSharing
  if (Object.keys(event).length > 0) ssePublish(id, event)

  return NextResponse.json(dbLectureToType(updated, dbChaptersToType(id)))
}
