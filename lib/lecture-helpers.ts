import { getDb } from './db'
import type { Lecture, Chapter, Question } from './types'

export function dbChaptersToType(lectureId: string): Chapter[] {
  const rows = getDb().prepare(
    'SELECT * FROM chapters WHERE lecture_id = ? ORDER BY order_idx'
  ).all(lectureId) as Array<{
    id: string
    title: string
    slide_start: number
    slide_end: number
    summary: string | null
    status: string
    order_idx: number
  }>
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    slideRange: [r.slide_start, r.slide_end] as [number, number],
    order: r.order_idx,
    summary: r.summary ?? undefined,
    status: r.status as Chapter['status'],
  }))
}

export interface LectureRow {
  id: string
  join_code: string
  title: string
  status: string
  total_slides: number
  current_slide: number
  current_chapter_id: string
  current_slide_image: string | null
  started_at: string | null
  created_by: string
  created_at: string
}

export function dbLectureToType(row: LectureRow, chapters: Chapter[]): Lecture {
  return {
    id: row.id,
    title: row.title,
    code: row.join_code,
    status: row.status as Lecture['status'],
    totalSlides: row.total_slides,
    chapters,
    createdAt: row.created_at,
    session: row.status === 'live' || row.status === 'ended' ? {
      lectureId: row.id,
      currentSlide: row.current_slide,
      currentChapterId: row.current_chapter_id,
      startedAt: row.started_at ?? new Date().toISOString(),
      elapsedSeconds: row.started_at
        ? Math.floor((Date.now() - new Date(row.started_at).getTime()) / 1000)
        : 0,
    } : undefined,
  }
}

export function dbQuestionsToType(lectureId: string): Question[] {
  const rows = getDb().prepare(
    'SELECT * FROM questions WHERE lecture_id = ? ORDER BY created_at DESC'
  ).all(lectureId) as Array<{
    id: string
    lecture_id: string
    chapter_id: string
    student_name: string
    content: string
    likes: number
    answered: number
    answer: string | null
    created_at: string
  }>
  return rows.map(r => ({
    id: r.id,
    lectureId: r.lecture_id,
    chapterId: r.chapter_id,
    studentName: r.student_name,
    content: r.content,
    likes: r.likes,
    answered: r.answered === 1,
    answer: r.answer ?? undefined,
    createdAt: r.created_at,
  }))
}
