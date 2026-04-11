export interface Chapter {
  id: string
  title: string
  slideRange: [number, number]
  order: number
  summary?: string
  durationMinutes?: number
  status: 'pending' | 'active' | 'completed'
}

export interface Question {
  id: string
  lectureId: string
  chapterId: string
  studentName: string
  content: string
  likes: number
  likedByMe?: boolean
  answered: boolean
  answer?: string
  createdAt: string
}

export interface LectureSession {
  lectureId: string
  currentSlide: number
  currentChapterId: string
  startedAt: string
  elapsedSeconds: number
}

export interface Lecture {
  id: string
  title: string
  code: string
  status: 'preparing' | 'live' | 'ended'
  chapters: Chapter[]
  totalSlides: number
  session?: LectureSession
  createdAt: string
  description?: string
  studentCount?: number
}

export interface ReportData {
  lectureId: string
  chapterDurations: { chapterId: string; title: string; minutes: number }[]
  topQuestions: Question[]
  engagementTimeline: { minute: number; score: number }[]
  unansweredQuestions: Question[]
  totalStudents: number
  totalQuestions: number
}
