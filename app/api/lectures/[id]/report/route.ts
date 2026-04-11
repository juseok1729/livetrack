import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getDb } from '@/lib/db'
import type { LectureRow } from '@/lib/lecture-helpers'

interface ChapterRow {
  id: string; title: string; slide_start: number; slide_end: number
  summary: string | null; status: string; order_idx: number
}
interface QuestionRow {
  id: string; chapter_id: string; student_name: string; content: string
  likes: number; answered: number; answer: string | null; created_at: string
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getDb()
  const lecture = db.prepare('SELECT * FROM lectures WHERE id = ?').get(id) as (LectureRow & { ended_at: string | null; peak_students: number }) | undefined
  if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const chapters = db.prepare(
    'SELECT * FROM chapters WHERE lecture_id = ? ORDER BY order_idx'
  ).all(id) as ChapterRow[]

  const questions = db.prepare(
    'SELECT * FROM questions WHERE lecture_id = ? ORDER BY likes DESC'
  ).all(id) as QuestionRow[]

  // Duration
  const startedAt = lecture.started_at ? new Date(lecture.started_at) : null
  const endedAt = lecture.ended_at ? new Date(lecture.ended_at) : new Date()
  const totalMinutes = startedAt ? Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)) : 0

  // Chapter durations — proportional to slide count
  const totalSlides = Math.max(1, lecture.total_slides)
  const chapterDurations = chapters.map(ch => ({
    id: ch.id,
    title: ch.title,
    minutes: totalMinutes > 0
      ? Math.max(1, Math.round(totalMinutes * (ch.slide_end - ch.slide_start + 1) / totalSlides))
      : 0,
  }))

  // Engagement timeline — bin questions into ~10 time buckets by created_at
  const BUCKETS = 10
  const buckets = Array(BUCKETS).fill(0)
  if (startedAt && questions.length > 0) {
    const durationMs = endedAt.getTime() - startedAt.getTime()
    questions.forEach(q => {
      const qTime = new Date(q.created_at).getTime() - startedAt.getTime()
      const idx = Math.min(BUCKETS - 1, Math.floor((qTime / durationMs) * BUCKETS))
      if (idx >= 0) buckets[idx]++
    })
  }
  const maxBucket = Math.max(1, ...buckets)
  const engagementTimeline = buckets.map((count, i) => ({
    minute: Math.round((totalMinutes / BUCKETS) * (i + 0.5)),
    // Normalize to 40-100 range: baseline 40 + activity up to 60
    score: Math.round(40 + (count / maxBucket) * 60),
  }))

  // Questions
  const topQuestions = questions.slice(0, 5).map(q => ({
    id: q.id, content: q.content, studentName: q.student_name,
    likes: q.likes, answered: q.answered === 1,
  }))
  const unansweredQuestions = questions
    .filter(q => q.answered === 0)
    .map(q => ({ id: q.id, content: q.content, studentName: q.student_name, likes: q.likes }))

  // Dynamic improvement tips
  const tips: string[] = []
  if (unansweredQuestions.length > 0) {
    tips.push(`미답변 질문 ${unansweredQuestions.length}개가 있습니다. 다음 강의 전에 답변해주세요.`)
  }
  // Chapter with most questions
  const questionsByChapter = new Map<string, number>()
  questions.forEach(q => questionsByChapter.set(q.chapter_id, (questionsByChapter.get(q.chapter_id) ?? 0) + 1))
  const busyChapterId = [...questionsByChapter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const busyChapter = chapters.find(c => c.id === busyChapterId)
  if (busyChapter) {
    tips.push(`"${busyChapter.title}" 챕터에서 질문이 가장 많았습니다. 관련 보충 자료를 준비해보세요.`)
  }
  // Engagement drop in later half
  const firstHalfAvg = buckets.slice(0, BUCKETS / 2).reduce((s, v) => s + v, 0) / (BUCKETS / 2)
  const secondHalfAvg = buckets.slice(BUCKETS / 2).reduce((s, v) => s + v, 0) / (BUCKETS / 2)
  if (firstHalfAvg > secondHalfAvg * 1.5) {
    tips.push('강의 후반부에 질문이 줄었습니다. 중간 질의응답 시간을 늘려보세요.')
  }
  if (tips.length === 0) {
    tips.push('질문 응답률이 좋습니다. 현재 강의 방식을 유지하세요.')
  }

  return NextResponse.json({
    totalMinutes,
    totalStudents: lecture.peak_students,
    totalQuestions: questions.length,
    chapterDurations,
    engagementTimeline,
    topQuestions,
    unansweredQuestions,
    tips,
  })
}
